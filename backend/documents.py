import os
from datetime import datetime, timezone
from pathlib import Path
from bson import ObjectId
import pymupdf

from fastapi import APIRouter, File, HTTPException, UploadFile, Query, BackgroundTasks
from database.mongodb import documents_collection, chunks_collection
from services.chunking import chunk_text
from services.embedding import generate_embeddings_batch
from services.document_health import get_all_documents_health
from services.reindex import reindex_all, detect_category, format_table_as_markdown

router = APIRouter(prefix="/documents", tags=["Documents"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    safe_filename = Path(file.filename).name
    ext = safe_filename.lower().split(".")[-1]
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported formats: PDF, DOCX, TXT.",
        )

    file_path = UPLOAD_DIR / safe_filename
    content = await file.read()
    file_path.write_bytes(content)

    category = detect_category(safe_filename)

    try:
        pdf = pymupdf.open(file_path)
        page_count = len(pdf)
        raw_chunks = []
        full_text_parts = []
        tables_found_total = 0

        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = pdf[page_idx]

            # 1. Extract tables
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
            except Exception:
                pass

            # 2. Extract text
            page_text = page.get_text().strip()
            if page_text:
                full_text_parts.append(page_text)
                t_chunks = chunk_text(
                    page_text,
                    chunk_size=900,
                    overlap=150,
                    page_number=page_num,
                    is_table=False,
                )
                for tc in t_chunks:
                    raw_chunks.append(tc)

        pdf.close()
        full_text = "\n\n".join(full_text_parts)

    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Could not process document: {exc}")

    # Insert or update document metadata
    document = {
        "filename": safe_filename,
        "file_type": ext,
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

    result = documents_collection.insert_one(document)
    doc_id = result.inserted_id

    # Batch embedding generation
    if raw_chunks:
        chunk_texts = [c["text"] for c in raw_chunks]
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

    return {
        "message": "Document uploaded, parsed with page-awareness, and indexed successfully",
        "document_id": str(doc_id),
        "filename": safe_filename,
        "category": category,
        "pages": page_count,
        "tables_detected": tables_found_total,
        "chunks_indexed": len(raw_chunks),
        "characters_extracted": len(full_text),
        "processing_status": "processed",
    }


@router.get("")
@router.get("/")
def get_documents(category: str = Query(None)):
    criteria = {}
    if category:
        criteria["document_category"] = category

    documents = list(documents_collection.find(criteria, {"extracted_text": 0}).sort("uploaded_at", -1))
    result = []
    for d in documents:
        result.append({
            "document_id": str(d["_id"]),
            "filename": d.get("filename", ""),
            "file_type": d.get("file_type", "pdf"),
            "page_count": d.get("page_count", 0),
            "characters_extracted": d.get("characters_extracted", 0),
            "document_category": d.get("document_category", "Uncategorized"),
            "tables_detected": d.get("tables_detected", 0),
            "chunks_count": chunks_collection.count_documents({"document_id": d["_id"]}),
            "processing_status": d.get("processing_status", "processed"),
            "uploaded_at": d.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
        })

    return {"count": len(result), "documents": result}


@router.get("/health")
def get_documents_health():
    """Returns deep diagnostic health and ingestion stats for all documents."""
    return get_all_documents_health()


@router.post("/reindex")
def trigger_reindex(background_tasks: BackgroundTasks):
    """Triggers complete re-indexing in the background."""
    background_tasks.add_task(reindex_all, force=True)
    return {"message": "Background re-indexing initiated", "status": "started"}


@router.get("/{document_id}")
def get_document(document_id: str):
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    document = documents_collection.find_one({"_id": ObjectId(document_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = list(chunks_collection.find(
        {"document_id": ObjectId(document_id)},
        {"embedding": 0}
    ).sort("chunk_index", 1).limit(50))

    for c in chunks:
        c["_id"] = str(c["_id"])
        c["document_id"] = str(c["document_id"])

    return {
        "document_id": str(document["_id"]),
        "filename": document.get("filename", ""),
        "file_type": document.get("file_type", "pdf"),
        "page_count": document.get("page_count", 0),
        "characters_extracted": document.get("characters_extracted", 0),
        "document_category": document.get("document_category", "Uncategorized"),
        "tables_detected": document.get("tables_detected", 0),
        "processing_status": document.get("processing_status", "processed"),
        "uploaded_at": document.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
        "extracted_text_preview": document.get("extracted_text", "")[:2000],
        "chunks_sample": chunks,
    }