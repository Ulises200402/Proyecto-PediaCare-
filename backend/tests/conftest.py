import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "test-secret-with-at-least-thirty-two-characters")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
