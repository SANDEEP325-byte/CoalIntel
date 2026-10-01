import sys
import importlib

packages = [
    "fastapi",
    "uvicorn",
    "pymongo",
    "pymupdf",
    "fitz",
    "sentence_transformers",
    "numpy",
    "requests",
    "pydantic",
    "docx",
    "multipart",
    "torch",
    "transformers",
]

print(f"Python Executable: {sys.executable}")
print(f"Python Version:    {sys.version}")
print("=" * 65)

all_passed = True
for pkg in packages:
    try:
        mod = importlib.import_module(pkg)
        ver = getattr(mod, "__version__", "Installed")
        print(f"  [OK] {pkg:22} | Version: {ver}")
    except Exception as exc:
        print(f"[FAIL] {pkg:22} | ERROR: {exc}")
        all_passed = False

print("=" * 65)
if all_passed:
    print("ALL ENVIRONMENT DEPENDENCIES VERIFIED IN .VENV!")
else:
    print("SOME DEPENDENCIES FAILED!")
    sys.exit(1)
