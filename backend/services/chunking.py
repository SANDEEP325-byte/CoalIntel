from typing import List, Dict
import re


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 150,
    page_number: int | None = None,
    is_table: bool = False,
) -> List[Dict]:
    """
    Splits text into page-aware chunks preserving sentence and paragraph boundaries.
    Ensures table content or numbers are not awkwardly split.
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # If text is small enough, return as single chunk
    if len(text) <= chunk_size:
        return [{
            "text": text,
            "page_number": page_number,
            "is_table": is_table,
        }]

    # If it's a table chunk and fits reasonably, keep it whole if under 1.5x chunk_size
    if is_table and len(text) <= int(chunk_size * 1.5):
        return [{
            "text": text,
            "page_number": page_number,
            "is_table": True,
        }]

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)

        # Try to break at paragraph or newline or period
        if end < text_length:
            # Look backwards for a natural break point
            break_point = -1
            search_window = text[max(start, end - 150):end]
            
            # Check for double newline
            dnl = search_window.rfind("\n\n")
            if dnl != -1:
                break_point = max(start, end - 150) + dnl + 2
            else:
                # Check for period followed by space or newline
                match = re.search(r'\.\s+', search_window[::-1])
                if match:
                    break_point = end - match.start()
                else:
                    # Check for single newline
                    nl = search_window.rfind("\n")
                    if nl != -1:
                        break_point = max(start, end - 150) + nl + 1
                    else:
                        # Check for space
                        sp = search_window.rfind(" ")
                        if sp != -1:
                            break_point = max(start, end - 150) + sp + 1

            if break_point > start:
                end = break_point

        chunk_str = text[start:end].strip()
        if chunk_str:
            chunks.append({
                "text": chunk_str,
                "page_number": page_number,
                "is_table": is_table,
            })

        if end >= text_length:
            break

        start = max(start + 1, end - overlap)

    return chunks