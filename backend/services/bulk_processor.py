from datetime import datetime, timezone
from pathlib import Path

import pymupdf

from database.mongodb import documents_collection, chunks_collection
from services.chunking import chunk_text
from services.embedding import generate_embedding


DATA_DIR = Path("../data")


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
    else:
        return "Mining Report"


def process_pdf(file_path: Path):
    print(f"\nProcessing: {file_path.name}")

    # Prevent duplicate processing
    existing_document = documents_collection.find_one(
        {"filename": file_path.name}
    )

    if existing_document:
        print(f"Already processed: {file_path.name}")

        return {
            "document_id": str(existing_document["_id"]),
            "filename": file_path.name,
            "status": "already_processed",
        }

    pdf = pymupdf.open(file_path)

    page_count = len(pdf)

    full_text_parts = []
    chunk_documents = []

    document = {
        "filename": file_path.name,
        "file_type": "pdf",
        "file_path": str(file_path),
        "page_count": page_count,
        "characters_extracted": 0,
        "extracted_text": "",
        "document_category": detect_category(file_path.name),
        "processing_status": "processing",
        "uploaded_at": datetime.now(timezone.utc),
    }

    result = documents_collection.insert_one(document)

    document_id = result.inserted_id

    chunk_index = 0
    total_characters = 0

    try:
        # Process PDF page by page
        for page_number, page in enumerate(pdf, start=1):

            page_text = page.get_text().strip()

            if not page_text:
                continue

            full_text_parts.append(page_text)

            total_characters += len(page_text)

            # Create chunks while preserving page number
            chunks = chunk_text(
                page_text,
                page_number=page_number,
            )

            print(
                f"Page {page_number}/{page_count} | "
                f"Characters: {len(page_text)} | "
                f"Chunks: {len(chunks)}"
            )

            for chunk_data in chunks:

                text = chunk_data["text"]
                chunk_page = chunk_data["page_number"]

                print(
                    f"Embedding chunk {chunk_index + 1}"
                )

                embedding = generate_embedding(text)

                chunk_documents.append(
                    {
                        "document_id": document_id,
                        "chunk_index": chunk_index,
                        "page_number": chunk_page,
                        "text": text,
                        "embedding": embedding,
                    }
                )

                chunk_index += 1

        pdf.close()

        full_text = "\n".join(full_text_parts)

        if not full_text.strip():
            raise ValueError(
                "No text could be extracted from PDF"
            )

        # Store all chunks
        if chunk_documents:
            chunks_collection.insert_many(chunk_documents)

        # Mark document as successfully processed
        documents_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "characters_extracted": total_characters,
                    "extracted_text": full_text,
                    "processing_status": "processed",
                }
            },
        )

        print(
            f"Completed: {file_path.name} | "
            f"Pages: {page_count} | "
            f"Characters: {total_characters} | "
            f"Chunks: {chunk_index}"
        )

        return {
            "document_id": str(document_id),
            "filename": file_path.name,
            "pages": page_count,
            "characters": total_characters,
            "chunks": chunk_index,
            "category": detect_category(file_path.name),
            "status": "processed",
        }

    except Exception:

        pdf.close()

        documents_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "processing_status": "failed",
                }
            },
        )

        raise


def process_all_pdfs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found in data folder.")
        return []

    print(f"Found {len(pdf_files)} PDF files.")

    results = []

    for pdf_file in pdf_files:

        try:
            result = process_pdf(pdf_file)

            results.append(result)

        except Exception as exc:

            print(f"FAILED: {pdf_file.name}")
            print(f"Error: {exc}")

    return results