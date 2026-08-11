# backend/ingest.py
import os
import glob
import hashlib
import re
import json
import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, "docs")
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "career_guidance_v1"

CHUNK_SIZE = 600
OVERLAP = 100

print(f"🔍 Loading MiniLM embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Model loaded.")

print(f"📁 Connecting to ChromaDB at: {CHROMA_PATH}")
client = chromadb.PersistentClient(path=CHROMA_PATH)
try:
    client.delete_collection(COLLECTION_NAME)
except Exception:
    pass
collection = client.create_collection(name=COLLECTION_NAME)

def chunk_text(text, chunk_size, overlap):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
        if start >= len(text):
            break
    return chunks

def extract_image_references(text, filename):
    images = []
    pattern = r'!\[(.*?)\]\((.*?)\)'
    matches = re.findall(pattern, text)
    for caption, path in matches:
        images.append({"path": path, "caption": caption})
    return images

# ---- Scan for files in DOCS_DIR ----
files = (glob.glob(os.path.join(DOCS_DIR, "*.md")) +
         glob.glob(os.path.join(DOCS_DIR, "*.txt")) +
         glob.glob(os.path.join(DOCS_DIR, "*.pdf")))

print(f"📄 Found {len(files)} document files in {DOCS_DIR}")

ids, documents, metadatas = [], [], []

for filepath in files:
    filename = os.path.basename(filepath)
    topic = filename.replace(".md", "").replace(".txt", "").replace(".pdf", "").replace("_", " ").title()
    text = ""
    all_images = []

    if filepath.endswith('.pdf'):
        try:
            reader = PdfReader(filepath)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            print(f"⚠️ Error reading PDF {filename}: {e}")
            continue
    else:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        if filepath.endswith('.md'):
            all_images = extract_image_references(text, filename)

    if not text.strip():
        print(f"⚠️ No text extracted from {filename}")
        continue

    chunks = chunk_text(text, CHUNK_SIZE, OVERLAP)
    for i, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{filename}_{i}".encode()).hexdigest()
        ids.append(chunk_id)
        documents.append(chunk)

        meta = {
            "doc_id": filename,
            "topic": topic,
            "chunk_index": i
        }
        if all_images:
            meta["images"] = json.dumps(all_images)
        metadatas.append(meta)

if documents:
    print(f"⚡ Embedding {len(documents)} chunks...")
    embeddings = model.encode(
        documents,
        normalize_embeddings=True,
        show_progress_bar=True,
        batch_size=32
    ).tolist()
    collection.add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
    print(f"🎉 SUCCESS! Indexed {len(documents)} chunks into ChromaDB at {CHROMA_PATH}.")
else:
    print("❌ No documents found in docs/ folder.")