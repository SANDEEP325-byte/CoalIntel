import sys
from pathlib import Path
from datetime import datetime, timezone
import pymupdf

# Adjust path so backend modules can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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


def reindex_all(force: bool = True):
    print("=" * 60)
    print("Starting CoalIntel Page-Aware Document Re-Indexing")
    print("=" * 60)

    pdf_files = list(DATA_DIR.glob("*.pdf"))
    if not pdf_files:
        # Check uploads dir as fallback
        pdf_files = list(UPLOADS_DIR.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in {DATA_DIR} or {UPLOADS_DIR}")
        return

    print(f"Found {len(pdf_files)} PDF files to index:")
    for f in pdf_files:
        print(f"  - {f.name} ({f.stat().st_size / 1024:.1f} KB)")

    if force:
        print("\nWiping stale chunks from MongoDB...")
        chunks_collection.delete_many({})
        print("Stale chunks wiped.")

    total_chunks_indexed = 0

    for pdf_path in pdf_files:
        print(f"\n---> Processing: {pdf_path.name}")
        category = detect_category(pdf_path.name)

        # Find or create document entry in documents_collection
        existing_doc = documents_collection.find_one({"filename": pdf_path.name})
        if existing_doc:
            doc_id = existing_doc["_id"]
        else:
            new_doc = {
                "filename": pdf_path.name,
                "file_type": "pdf",
                "file_path": str(pdf_path),
                "page_count": 0,
                "characters_extracted": 0,
                "extracted_text": "",
                "document_category": category,
                "processing_status": "processing",
                "uploaded_at": datetime.now(timezone.utc),
            }
            res = documents_collection.insert_one(new_doc)
            doc_id = res.inserted_id

        # Open PDF
        doc = pymupdf.open(pdf_path)
        page_count = len(doc)
        full_text_parts = []
        raw_chunks = []
        tables_found_total = 0

        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = doc[page_idx]

            # 1. Extract structured tables
            try:
                tables = page.find_tables()
                if tables and tables.tables:
                    for t_idx, tab in enumerate(tables):
                        md_table = format_table_as_markdown(tab)
                        if md_table and len(md_table) > 30:
                            tables_found_total += 1
                            table_chunk_text = f"[TABLE: Page {page_num} - Table {t_idx+1}]\n{md_table}"
                            raw_chunks.append({
                                "text": table_chunk_text,
                                "page_number": page_num,
                                "is_table": True,
                            })
                            full_text_parts.append(table_chunk_text)
            except Exception as e:
                pass

            # 2. Extract regular text
            p_text = page.get_text().strip()
            if p_text:
                full_text_parts.append(p_text)
                text_chunks = chunk_text(
                    p_text,
                    chunk_size=900,
                    overlap=150,
                    page_number=page_num,
                    is_table=False,
                )
                for tc in text_chunks:
                    raw_chunks.append(tc)

        doc.close()
        full_extracted_text = "\n\n".join(full_text_parts)

        print(f"  Extracted {len(raw_chunks)} chunks across {page_count} pages ({tables_found_total} tables detected).")

        # 3. Batch generate embeddings
        print("  Generating batch embeddings with sentence-transformers...")
        chunk_texts = [c["text"] for c in raw_chunks]
        embeddings = generate_embeddings_batch(chunk_texts, batch_size=32)

        # 4. Prepare chunk documents
        chunk_documents = []
        org = "CMPDI" if "CMPDI" in pdf_path.name.upper() else ("CIL" if "CIL" in pdf_path.name.upper() else ("DGMS / CIL" if "SAFETY" in pdf_path.name.upper() else "Ministry of Coal / All India"))
        f_yr = "2025-26" if "2025-26" in pdf_path.name else "2024-25"

        for i, (rc, emb) in enumerate(zip(raw_chunks, embeddings)):
            text_str = rc["text"]
            chunk_documents.append({
                "document_id": doc_id,
                "document_name": pdf_path.name,
                "document_category": category,
                "organization": org,
                "fiscal_year": f_yr,
                "chunk_index": i,
                "page_number": rc["page_number"],
                "text": text_str,
                "is_table": rc.get("is_table", False),
                "character_count": len(text_str),
                "token_estimate": max(1, len(text_str) // 4),
                "embedding": emb,
            })

        if chunk_documents:
            chunks_collection.insert_many(chunk_documents)
            total_chunks_indexed += len(chunk_documents)

        # 5. Update document record
        documents_collection.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "organization": org,
                    "fiscal_year": f_yr,
                    "page_count": page_count,
                    "characters_extracted": len(full_extracted_text),
                    "extracted_text": full_extracted_text,
                    "document_category": category,
                    "tables_detected": tables_found_total,
                    "chunks_count": len(chunk_documents),
                    "processing_status": "processed",
                    "indexed_at": datetime.now(timezone.utc),
                }
            },
        )
        print(f"  Finished indexing {pdf_path.name}: {len(chunk_documents)} chunks saved.")

    ensure_indexes()
    print("\n" + "=" * 60)
    print(f"Re-indexing Complete! Total Chunks Indexed: {total_chunks_indexed}")
    print(f"Total Documents in DB: {documents_collection.count_documents({})}")
    print("=" * 60)


if __name__ == "__main__":
    reindex_all(force=True)
