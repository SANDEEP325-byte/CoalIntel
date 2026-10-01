import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
import pymupdf

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from database.mongodb import documents_collection, chunks_collection, ensure_indexes
from services.chunking import chunk_text
from services.embedding import generate_embeddings_batch

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def detect_category(filename: str) -> str:
    name = filename.lower()
    if "cmpdi" in name or "cmpdil" in name:
        return "CMPDI"
    elif "safety" in name:
        return "Mine Safety"
    elif "production" in name or "lignite" in name:
        return "Coal & Lignite Production"
    elif "cil" in name:
        return "CIL"
    return "Mining Report"


def format_table_as_markdown(table) -> str:
    """Converts a PyMuPDF extracted table into a clean, valid markdown table string."""
    try:
        data = table.extract()
        if not data or len(data) < 2:
            return ""

        raw_headers = data[0]
        col_count = len(raw_headers)
        if col_count == 0:
            return ""

        headers = [
            str(col).replace("\n", " ").replace("|", "/").strip() if col is not None and str(col).strip() != "" else f"Column_{i+1}"
            for i, col in enumerate(raw_headers)
        ]
        header_row = "| " + " | ".join(headers) + " |"
        separator_row = "| " + " | ".join(["---"] * col_count) + " |"

        body_rows = []
        for row in data[1:]:
            clean_cells = []
            for i in range(col_count):
                cell_val = row[i] if i < len(row) else ""
                clean_str = str(cell_val).replace("\n", " ").replace("|", "/").strip() if cell_val is not None else ""
                clean_cells.append(clean_str)
            if any(c for c in clean_cells):
                body_rows.append("| " + " | ".join(clean_cells) + " |")

        if not body_rows:
            return ""

        return "\n".join([header_row, separator_row] + body_rows)
    except Exception:
        return ""


def process_pdf(file_path: Path, force: bool = False) -> Dict[str, Any]:
    """
    Processes a single PDF document with page-awareness, table preservation, and batch embeddings.
    Guarantees that every chunk contains document_name, document_category, page_number, and embedding.
    """
    ensure_indexes()
    safe_filename = file_path.name
    category = detect_category(safe_filename)
    print(f"\n[BULK PROCESSOR] Processing: {safe_filename} ({category})")

    # Prevent duplicate processing unless force is True
    existing_document = documents_collection.find_one({"filename": safe_filename})
    if existing_document and not force:
        chunk_count = chunks_collection.count_documents({"document_name": safe_filename})
        print(f"[BULK PROCESSOR] Already processed: {safe_filename} ({chunk_count} chunks indexed)")
        return {
            "document_id": str(existing_document["_id"]),
            "filename": safe_filename,
            "category": category,
            "status": "already_processed",
            "chunks_count": chunk_count,
        }

    # If force, remove old records for this document
    if existing_document and force:
        chunks_collection.delete_many({"document_id": existing_document["_id"]})
        documents_collection.delete_one({"_id": existing_document["_id"]})

    try:
        pdf = pymupdf.open(file_path)
    except Exception as exc:
        print(f"[ERROR] Could not open PDF {safe_filename}: {exc}")
        return {"filename": safe_filename, "status": "failed", "error": str(exc)}

    page_count = len(pdf)
    full_text_parts: List[str] = []
    raw_chunks: List[Dict[str, Any]] = []
    tables_found_total = 0

    try:
        for page_idx, page in enumerate(pdf):
            page_num = page_idx + 1

            # 1. Detect & preserve tables as markdown chunks
            try:
                tabs = page.find_tables()
                if tabs and tabs.tables:
                    for t_idx, tab in enumerate(tabs.tables):
                        table_md = format_table_as_markdown(tab)
                        if table_md and len(table_md) > 30:
                            tables_found_total += 1
                            table_chunk_text = f"TABLE (Page {page_num}, Document: {safe_filename}):\n{table_md}"
                            raw_chunks.append({
                                "text": table_chunk_text,
                                "page_number": page_num,
                                "is_table": True,
                            })
                            full_text_parts.append(table_chunk_text)
            except Exception:
                pass

            page_text = str(page.get_text() or "").strip()
            if page_text:
                full_text_parts.append(page_text)
                text_chunks = chunk_text(
                    page_text,
                    chunk_size=900,
                    overlap=150,
                    page_number=page_num,
                    is_table=False,
                )
                for tc in text_chunks:
                    raw_chunks.append(tc)

        pdf.close()
        full_text = "\n\n".join(full_text_parts)

    except Exception as exc:
        pdf.close()
        print(f"[ERROR] Extraction failed for {safe_filename}: {exc}")
        return {"filename": safe_filename, "status": "failed", "error": str(exc)}

    # Insert document record into MongoDB
    document_record = {
        "filename": safe_filename,
        "file_type": file_path.suffix.lower().replace(".", ""),
        "file_path": str(file_path),
        "page_count": page_count,
        "characters_extracted": len(full_text),
        "extracted_text": full_text,
        "document_category": category,
        "tables_detected": tables_found_total,
        "chunks_count": len(raw_chunks),
        "processing_status": "processed",
        "uploaded_at": datetime.now(timezone.utc),
    }

    insert_result = documents_collection.insert_one(document_record)
    doc_id = insert_result.inserted_id

    # Batch embedding generation
    if raw_chunks:
        print(f"[BULK PROCESSOR] Generating batch embeddings for {len(raw_chunks)} chunks...")
        chunk_texts = [str(c["text"]) for c in raw_chunks]
        embeddings = generate_embeddings_batch(chunk_texts, batch_size=32)

        chunk_docs = []
        for i, (rc, emb) in enumerate(zip(raw_chunks, embeddings)):
            chunk_docs.append({
                "document_id": doc_id,
                "document_name": safe_filename,
                "document_category": category,
                "chunk_index": i,
                "page_number": rc["page_number"],
                "text": rc["text"],
                "is_table": rc.get("is_table", False),
                "embedding": emb,
            })

        chunks_collection.insert_many(chunk_docs)

    print(
        f"[BULK PROCESSOR] Completed: {safe_filename} | "
        f"Pages: {page_count} | Tables: {tables_found_total} | Chunks: {len(raw_chunks)}"
    )

    return {
        "document_id": str(doc_id),
        "filename": safe_filename,
        "category": category,
        "pages": page_count,
        "tables_detected": tables_found_total,
        "chunks_indexed": len(raw_chunks),
        "characters_extracted": len(full_text),
        "status": "processed",
    }


def process_all_pdfs(force: bool = False) -> List[Dict[str, Any]]:
    """Scans data/ and uploads/ directories and processes all PDF documents."""
    ensure_indexes()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files: List[Path] = []
    for directory in [DATA_DIR, UPLOADS_DIR]:
        if directory.exists():
            pdf_files.extend(list(directory.glob("*.pdf")))

    # Deduplicate by filename
    seen = set()
    unique_pdfs: List[Path] = []
    for p in pdf_files:
        if p.name not in seen:
            seen.add(p.name)
            unique_pdfs.append(p)

    if not unique_pdfs:
        print("[BULK PROCESSOR] No PDF files found in data or uploads directories.")
        return []

    print(f"[BULK PROCESSOR] Found {len(unique_pdfs)} unique PDF files for bulk processing.")
    results = []
    for pdf_path in unique_pdfs:
        try:
            res = process_pdf(pdf_path, force=force)
            results.append(res)
        except Exception as exc:
            print(f"[BULK PROCESSOR FAILED] {pdf_path.name}: {exc}")
            results.append({"filename": pdf_path.name, "status": "failed", "error": str(exc)})

    return results


if __name__ == "__main__":
    process_all_pdfs()