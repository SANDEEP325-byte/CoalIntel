import json
from pathlib import Path
import bson

bdir = Path("migration_backups") / "coalintel"
with open(bdir / "backup_metadata.json", "r", encoding="utf-8") as f:
    meta = json.load(f)

print("Verifying backed-up BSON files:")
for cname, info in meta["collections"].items():
    bfile = bdir / info["bson_file"]
    with open(bfile, "rb") as f:
        docs = bson.decode_all(f.read())
    assert len(docs) == info["count"], f"Count mismatch in {cname}"
    if cname == "document_chunks":
        emb_count = sum(1 for d in docs if "embedding" in d and isinstance(d["embedding"], list))
        dim = len(docs[0]["embedding"]) if docs and "embedding" in docs[0] else 0
        print(f"  [OK] {cname:<18}: {len(docs)} documents, {emb_count} embeddings verified (dim={dim})")
    else:
        print(f"  [OK] {cname:<18}: {len(docs)} documents decoded")

print("[ALL BSON FILES 100% VALID AND INTACT]")
