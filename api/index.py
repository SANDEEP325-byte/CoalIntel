import sys
from pathlib import Path

# Make both the repo root (for `backend.*` imports) and backend/ (for flat imports) importable
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from backend.main import app  # noqa: E402,F401  (Vercel serves the ASGI `app`)