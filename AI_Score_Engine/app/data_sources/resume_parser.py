"""Utilities for extracting text from resume files (PDFs).

This module is responsible for turning a user-uploaded resume PDF
into plain text, which is then passed into the feature logic in
app/features/resume_features.py as the "resume_text" field.
"""

from __future__ import annotations

from io import BytesIO
from typing import BinaryIO

import fitz  # PyMuPDF


def extract_text_from_pdf_path(path: str) -> str:
	"""Extract plain text from a PDF on disk.

	Parameters
	----------
	path: str
		Filesystem path to the PDF file.
	"""

	text_parts: list[str] = []

	with fitz.open(path) as doc:
		for page in doc:
			page_text = page.get_text("text") or ""
			text_parts.append(page_text)

	return "\n".join(text_parts).strip()


def extract_text_from_pdf_bytes(data: bytes | BinaryIO) -> str:
	"""Extract text from a PDF given raw bytes or a binary file-like.

	This is useful when handling uploads in FastAPI (e.g., UploadFile),
	where you receive the file content in memory instead of a path.
	"""

	if hasattr(data, "read"):
		raw = data.read()
	else:
		raw = data

	text_parts: list[str] = []

	with fitz.open(stream=BytesIO(raw), filetype="pdf") as doc:
		for page in doc:
			page_text = page.get_text("text") or ""
			text_parts.append(page_text)

	return "\n".join(text_parts).strip()


if __name__ == "__main__":
	# Simple manual test: python -m app.data_sources.resume_parser path/to/resume.pdf
	import sys

	if len(sys.argv) != 2:
		print("Usage: python -m app.data_sources.resume_parser <resume.pdf>")
		raise SystemExit(1)

	pdf_path = sys.argv[1]
	text = extract_text_from_pdf_path(pdf_path)
	print(text)
