"""
storage.py - Reads and writes our JSON "database" files safely.
Every module (employees, leave, attendance...) uses these functions.
"""
import json
import os
import tempfile
import threading
from pathlib import Path

# Folder where all JSON files are stored (backend/data)
DATA_DIR = Path(__file__).parent / "data"

# A lock makes sure two requests never write a file at the same moment
_write_lock = threading.Lock()


def _file_path(name: str) -> Path:
    """Turn 'employees' into the full path .../data/employees.json"""
    return DATA_DIR / f"{name}.json"


def read_data(name: str) -> list:
    """Read a JSON file and return its list of records."""
    path = _file_path(name)
    if not path.exists():
        return []  # a missing file just means "no records yet"
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        raise RuntimeError(f"{path.name} is not valid JSON. Please fix the file.")
    if not isinstance(data, list):
        raise RuntimeError(f"{path.name} must contain a list [ ... ]")
    return data


def write_data(name: str, data: list) -> None:
    """
    Save records SAFELY:
    1. write to a temporary file
    2. then replace the real file in one step
    If anything fails, the original file stays untouched.
    """
    DATA_DIR.mkdir(exist_ok=True)
    path = _file_path(name)
    with _write_lock:
        fd, temp_path = tempfile.mkstemp(dir=DATA_DIR, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())  # force the data onto the disk
            os.replace(temp_path, path)  # swap in the new file
        except Exception:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise


def next_id(items: list, prefix: str, width: int = 3) -> str:
    """
    Create the next ID. Example: existing EMP001, EMP002 -> returns EMP003
    """
    numbers = []
    for item in items:
        item_id = str(item.get("id", ""))
        number_part = item_id[len(prefix):]
        if item_id.startswith(prefix) and number_part.isdigit():
            numbers.append(int(number_part))
    return f"{prefix}{max(numbers, default=0) + 1:0{width}d}"


def find_by_id(items: list, item_id: str):
    """Return the record with this id, or None if not found."""
    return next((item for item in items if item.get("id") == item_id), None)
