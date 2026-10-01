import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))
from database.mongodb import chunks_collection

print("=== CHUNK 30 ===")
c30 = chunks_collection.find_one({'document_name': 'CMPDIL_Annual_Report_2024-25.pdf', 'chunk_index': 30})
if c30:
    print(c30.get('text'))

print("\n=== SEARCH SEISMIC IN CMPDIL ===")
seismic_chunks = list(chunks_collection.find(
    {'document_name': 'CMPDIL_Annual_Report_2024-25.pdf', 'text': {'$regex': 'seismic', '$options': 'i'}},
    {'page_number': 1, 'chunk_index': 1, 'text': 1}
).limit(5))
for c in seismic_chunks:
    print(f"Page {c.get('page_number')}, Chunk {c.get('chunk_index')}:")
    print(c.get('text')[:300])
    print("-" * 40)

print("\n=== SEARCH PBT / PROFIT BEFORE TAX IN CMPDIL ===")
pbt_chunks = list(chunks_collection.find(
    {'document_name': 'CMPDIL_Annual_Report_2024-25.pdf', 'text': {'$regex': 'Profit Before Tax|PBT', '$options': 'i'}},
    {'page_number': 1, 'chunk_index': 1, 'text': 1}
).limit(5))
for c in pbt_chunks:
    print(f"Page {c.get('page_number')}, Chunk {c.get('chunk_index')}:")
    print(c.get('text')[:300])
    print("-" * 40)
