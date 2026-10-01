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

        if end < text_length:
            # Look backwards in the search window for a natural boundary
            window_start = max(start, end - 150)
            search_window = text[window_start:end]

            # Priority 1: Double newline (paragraph break)
            dnl_idx = search_window.rfind("\n\n")
            if dnl_idx != -1 and (window_start + dnl_idx + 2) > start:
                end = window_start + dnl_idx + 2
            else:
                # Priority 2: Sentence terminal (. ! ?) followed by whitespace
                sentence_breaks = [m.end() for m in re.finditer(r'[\.\?\!]\s+', search_window)]
                if sentence_breaks and (window_start + sentence_breaks[-1]) > start:
                    end = window_start + sentence_breaks[-1]
                else:
                    # Priority 3: Single newline
                    nl_idx = search_window.rfind("\n")
                    if nl_idx != -1 and (window_start + nl_idx + 1) > start:
                        end = window_start + nl_idx + 1
                    else:
                        # Priority 4: Space
                        sp_idx = search_window.rfind(" ")
                        if sp_idx != -1 and (window_start + sp_idx + 1) > start:
                            end = window_start + sp_idx + 1

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