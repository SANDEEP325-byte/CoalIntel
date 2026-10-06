import os
import hashlib
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pathlib import Path
from bson import ObjectId
import pymupdf

from fastapi import APIRouter, File, HTTPException, UploadFile, Query, BackgroundTasks, Depends
from database.mongodb import documents_collection, chunks_collection
from services.chunking import chunk_text
from services.embedding import generate_embeddings_batch
from services.document_health import get_all_documents_health
from services.reindex import reindex_all, detect_category, format_table_as_markdown
from services.semantic_search import invalidate_embedding_cache
from services.auth import require_permission
from services.audit import log_audit_event

router = APIRouter(prefix="/documents", tags=["Documents"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = Path("/tmp/uploads") if os.getenv("VERCEL") else BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def calculate_content_hash(data: bytes) -> str:
    """Computes SHA-256 digest of file content for exact duplicate detection."""
    return hashlib.sha256(data).hexdigest()


def detect_organization(filename: str) -> str:
    """Infers the primary mining organization from the document name."""
    fn = filename.upper()
    if "CMPDI" in fn or "CMPDIL" in fn:
        return "CMPDI"
    elif "CIL" in fn or "COAL INDIA" in fn:
        return "CIL"
    elif "SCCL" in fn or "SINGARENI" in fn:
        return "SCCL"
    elif "SAFETY" in fn:
        return "DGMS / CIL"
    elif "PRODUCTION" in fn or "LIGNITE" in fn:
        return "Ministry of Coal / All India"
    return "All India"


def detect_fiscal_year(filename: str) -> str:
    """Extracts the statutory fiscal year from the filename."""
    fn = filename
    if "2024-25" in fn or "2024_25" in fn or "2024–25" in fn:
        return "2024-25"
    elif "2025-26" in fn or "2025_26" in fn:
        return "2025-26"
    elif "2023-24" in fn or "2023_24" in fn:
        return "2023-24"
    elif "2022-23" in fn:
        return "2022-23"
    return "2024-25"


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(require_permission("document.upload")),
):
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

    # Security: Verify magic bytes for PDF files
    if ext == "pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Security validation failed: File has .pdf extension but lacks valid %PDF header signature.",
        )

    content_hash = calculate_content_hash(content)
    file_path.write_bytes(content)

    category = detect_category(safe_filename)
    organization = detect_organization(safe_filename)
    fiscal_year = detect_fiscal_year(safe_filename)

    # Check for duplicate document content
    existing_duplicate = documents_collection.find_one({"content_hash": content_hash, "filename": {"$ne": safe_filename}})
    duplicate_warning = None
    if existing_duplicate:
        duplicate_warning = f"Notice: Content matches existing document '{existing_duplicate.get('filename')}' with identical SHA-256 hash."

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

    # Prevent duplicate chunk pollution by removing existing chunks with same filename
    chunks_collection.delete_many({"document_name": safe_filename})
    documents_collection.delete_many({"filename": safe_filename})

    # Insert document metadata
    document = {
        "filename": safe_filename,
        "file_type": ext,
        "file_path": str(file_path),
        "content_hash": content_hash,
        "organization": organization,
        "fiscal_year": fiscal_year,
        "page_count": page_count,
        "characters_extracted": len(full_text),
        "extracted_text": full_text,
        "document_category": category,
        "tables_detected": tables_found_total,
        "chunks_count": len(raw_chunks),
        "processing_status": "processed",
        "duplicate_warning": duplicate_warning,
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
            text_str = rc["text"]
            chunk_docs.append({
                "document_id": doc_id,
                "document_name": safe_filename,
                "document_category": category,
                "organization": organization,
                "fiscal_year": fiscal_year,
                "chunk_index": i,
                "page_number": rc["page_number"],
                "text": text_str,
                "is_table": rc.get("is_table", False),
                "character_count": len(text_str),
                "token_estimate": max(1, len(text_str) // 4),
                "embedding": emb,
            })

        chunks_collection.insert_many(chunk_docs)
        invalidate_embedding_cache()

    log_audit_event(
        action="document.upload",
        resource="document",
        user_id=str(current_user["_id"]),
        username=current_user.get("username"),
        resource_id=str(doc_id),
        status="success",
        metadata={
            "filename": safe_filename,
            "category": category,
            "pages": page_count,
            "chunks_indexed": len(raw_chunks),
            "content_hash": content_hash,
        },
    )

    return {
        "message": "Document uploaded, parsed with page-awareness, and indexed successfully",
        "document_id": str(doc_id),
        "filename": safe_filename,
        "category": category,
        "organization": organization,
        "fiscal_year": fiscal_year,
        "pages": page_count,
        "tables_detected": tables_found_total,
        "chunks_indexed": len(raw_chunks),
        "characters_extracted": len(full_text),
        "content_hash": content_hash,
        "duplicate_warning": duplicate_warning,
        "processing_status": "processed",
    }


@router.get("")
@router.get("/")
def get_documents(
    category: Optional[str] = Query(None),
    organization: Optional[str] = Query(None),
    fiscal_year: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_permission("document.read")),
):
    criteria = {}
    if category:
        criteria["document_category"] = category
    if organization:
        criteria["organization"] = organization
    if fiscal_year:
        criteria["fiscal_year"] = fiscal_year

    documents = list(documents_collection.find(criteria, {"extracted_text": 0}).sort("uploaded_at", -1))
    result = []
    for d in documents:
        result.append({
            "document_id": str(d["_id"]),
            "filename": d.get("filename", ""),
            "file_type": d.get("file_type", "pdf"),
            "organization": d.get("organization") or detect_organization(d.get("filename", "")),
            "fiscal_year": d.get("fiscal_year") or detect_fiscal_year(d.get("filename", "")),
            "content_hash": d.get("content_hash", ""),
            "duplicate_warning": d.get("duplicate_warning"),
            "page_count": d.get("page_count", 0),
            "characters_extracted": d.get("characters_extracted", 0),
            "document_category": d.get("document_category", "Uncategorized"),
            "tables_detected": d.get("tables_detected", 0),
            "chunks_count": chunks_collection.count_documents({"document_id": d["_id"]}),
            "processing_status": d.get("processing_status", "processed"),
            "uploaded_at": d.get("uploaded_at", datetime.now(timezone.utc)).isoformat() if hasattr(d.get("uploaded_at"), "isoformat") else str(d.get("uploaded_at")),
        })

    return {"count": len(result), "documents": result}


@router.get("/health")
def get_documents_health(
    current_user: Dict[str, Any] = Depends(require_permission("document.read")),
):
    """Returns deep diagnostic health and ingestion stats for all documents."""
    return get_all_documents_health()


@router.post("/reindex")
def trigger_reindex(
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(require_permission("document.reindex")),
):
    """Triggers complete re-indexing in the background."""
    invalidate_embedding_cache()
    background_tasks.add_task(reindex_all, force=True)
    log_audit_event(
        action="document.reindex",
        resource="system",
        user_id=str(current_user["_id"]),
        username=current_user.get("username"),
        status="success",
    )
    return {"message": "Background re-indexing initiated", "status": "started"}


@router.get("/check-duplicate")
def check_duplicate_document(
    content_hash: Optional[str] = Query(None, description="SHA-256 hash of document content"),
    filename: Optional[str] = Query(None, description="Filename to check"),
    current_user: Dict[str, Any] = Depends(require_permission("document.read")),
):
    """Checks if a document with the given content hash or filename already exists."""
    if not content_hash and not filename:
        raise HTTPException(status_code=400, detail="Must provide content_hash or filename")
    
    query = {}
    if content_hash:
        query["content_hash"] = content_hash
    elif filename:
        query["filename"] = filename
    
    existing = documents_collection.find_one(query)
    if existing:
        return {
            "exists": True,
            "document_id": str(existing["_id"]),
            "filename": existing.get("filename"),
            "uploaded_at": str(existing.get("uploaded_at"))
        }
    return {"exists": False}


@router.get("/{document_id}")
def get_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("document.read")),
):
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
        "organization": document.get("organization") or detect_organization(document.get("filename", "")),
        "fiscal_year": document.get("fiscal_year") or detect_fiscal_year(document.get("filename", "")),
        "content_hash": document.get("content_hash", ""),
        "page_count": document.get("page_count", 0),
        "characters_extracted": document.get("characters_extracted", 0),
        "document_category": document.get("document_category", "Uncategorized"),
        "tables_detected": document.get("tables_detected", 0),
        "processing_status": document.get("processing_status", "processed"),
        "uploaded_at": document.get("uploaded_at", datetime.now(timezone.utc)).isoformat() if hasattr(document.get("uploaded_at"), "isoformat") else str(document.get("uploaded_at")),
        "extracted_text_preview": document.get("extracted_text", "")[:2000],
        "chunks_sample": chunks,
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("document.delete")),
):
    """
    Deletes a document record, physical file, and all cascading vector chunks from MongoDB.
    Refreshes in-memory embedding cache immediately.
    """
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    oid = ObjectId(document_id)
    doc = documents_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    filename = doc.get("filename", "")
    file_path = doc.get("file_path")
    if file_path:
        p = Path(file_path)
        if p.exists():
            p.unlink(missing_ok=True)

    # Delete all associated chunks
    deleted_chunks = chunks_collection.delete_many({"document_id": oid})
    if filename:
        chunks_collection.delete_many({"document_name": filename})

    documents_collection.delete_one({"_id": oid})
    invalidate_embedding_cache()

    log_audit_event(
        action="document.delete",
        resource="document",
        user_id=str(current_user["_id"]),
        username=current_user.get("username"),
        resource_id=document_id,
        status="success",
        metadata={"filename": filename, "deleted_chunks": deleted_chunks.deleted_count},
    )

    return {
        "message": f"Document '{filename}' and {deleted_chunks.deleted_count} chunks successfully deleted",
        "deleted_document_id": document_id,
        "deleted_chunks": deleted_chunks.deleted_count,
        "filename": filename,
    }


@router.post("/{document_id}/reprocess")
def reprocess_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("document.reprocess")),
):
    """Reprocesses an existing document to regenerate tables, chunks, and metadata."""
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    oid = ObjectId(document_id)
    doc = documents_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path_str = doc.get("file_path")
    if not file_path_str or not Path(file_path_str).exists():
        raise HTTPException(status_code=400, detail="Physical file missing on server disk")

    file_path = Path(file_path_str)
    safe_filename = doc.get("filename", file_path.name)
    content = file_path.read_bytes()
    content_hash = calculate_content_hash(content)
    category = detect_category(safe_filename)
    organization = detect_organization(safe_filename)
    fiscal_year = detect_fiscal_year(safe_filename)

    try:
        pdf = pymupdf.open(file_path)
        page_count = len(pdf)
        raw_chunks = []
        full_text_parts = []
        tables_found_total = 0

        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = pdf[page_idx]

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

        chunks_collection.delete_many({"document_id": oid})
        chunks_collection.delete_many({"document_name": safe_filename})

        now_iso = datetime.now(timezone.utc)
        documents_collection.update_one(
            {"_id": oid},
            {"$set": {
                "content_hash": content_hash,
                "organization": organization,
                "fiscal_year": fiscal_year,
                "page_count": page_count,
                "characters_extracted": len(full_text),
                "extracted_text": full_text,
                "document_category": category,
                "tables_detected": tables_found_total,
                "chunks_count": len(raw_chunks),
                "processing_status": "processed",
                "reprocessed_at": now_iso,
            }}
        )

        if raw_chunks:
            chunk_texts = [c["text"] for c in raw_chunks]
            embeddings = generate_embeddings_batch(chunk_texts, batch_size=32)

            chunk_docs = []
            for i, (rc, emb) in enumerate(zip(raw_chunks, embeddings)):
                text_str = rc["text"]
                chunk_docs.append({
                    "document_id": oid,
                    "document_name": safe_filename,
                    "document_category": category,
                    "organization": organization,
                    "fiscal_year": fiscal_year,
                    "chunk_index": i,
                    "page_number": rc["page_number"],
                    "text": text_str,
                    "is_table": rc.get("is_table", False),
                    "character_count": len(text_str),
                    "token_estimate": max(1, len(text_str) // 4),
                    "embedding": emb,
                })

            chunks_collection.insert_many(chunk_docs)

        invalidate_embedding_cache()

        log_audit_event(
            action="document.reprocess",
            resource="document",
            user_id=str(current_user["_id"]),
            username=current_user.get("username"),
            resource_id=document_id,
            status="success",
            metadata={"filename": safe_filename, "chunks_indexed": len(raw_chunks)},
        )

        return {
            "message": f"Document '{safe_filename}' successfully reprocessed and re-indexed",
            "document_id": document_id,
            "filename": safe_filename,
            "chunks_count": len(raw_chunks),
            "pages": page_count,
            "status": "processed",
        }

    except Exception as exc:
        log_audit_event(
            action="document.reprocess",
            resource="document",
            user_id=str(current_user["_id"]),
            username=current_user.get("username"),
            resource_id=document_id,
            status="failure",
            metadata={"error": str(exc)},
        )
        raise HTTPException(status_code=500, detail=f"Failed to reprocess document: {exc}")

