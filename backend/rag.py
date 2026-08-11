# backend/rag.py
import os
import json
import chromadb
import logging
import re
from sentence_transformers import SentenceTransformer
from prompts import SYSTEM_PROMPT_RAG, REFUSAL_TEXT
from sarvam_client import call_asar as call_llm
from dotenv import load_dotenv

def extract_chart_data(answer: str) -> dict:
    pattern1 = r'([\w\s]+?)\s+[█░]+\s+(\d+)%'
    matches = re.findall(pattern1, answer)
    if matches:
        labels = [m[0].strip() for m in matches]
        data = [int(m[1]) for m in matches]
        return {"labels": labels, "data": data, "type": "bar"}
    pattern2 = r'([\w\s]+?):\s*(\d+)%'
    matches = re.findall(pattern2, answer)
    if matches:
        labels = [m[0].strip() for m in matches]
        data = [int(m[1]) for m in matches]
        return {"labels": labels, "data": data, "type": "bar"}
    return None

def detect_hallucination(answer: str, context: str) -> bool:
    """
    Simple hallucination check: if answer has no citations or uses external knowledge phrases.
    """
    # Check citations
    if not re.search(r'\[\d+\]', answer):
        return True
    # Check for external knowledge phrases
    external_phrases = [
        "according to my knowledge", "i think", "i believe",
        "as per my training", "from my understanding", "in general"
    ]
    for phrase in external_phrases:
        if phrase in answer.lower():
            return True
    return False

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("🔍 Loading MiniLM embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Model loaded.")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma_db")

client = chromadb.PersistentClient(path=CHROMA_PATH)
try:
    collection = client.get_collection("career_guidance_v1")
except Exception:
    collection = client.get_or_create_collection("career_guidance_v1")
print(f"✅ Connected to ChromaDB at {CHROMA_PATH}. Collection has {collection.count()} chunks.")

TOP_K = 8
RELEVANCE_THRESHOLD = 1.4

def classify_intent(question: str) -> str:
    keywords = {
        "college": ["college", "university", "iit", "nit", "nirf", "rank", "admission", "campus"],
        "certification": ["certification", "cert", "aws", "azure", "google cloud", "cisco", "compTIA"],
        "role": ["engineer", "analyst", "developer", "designer", "manager", "scientist", "architect"],
        "skill": ["skill", "learn", "python", "sql", "machine learning", "data", "programming"],
        "roadmap": ["roadmap", "path", "phase", "30 days", "60 days", "90 days", "plan", "how to become", "steps to become"]
    }
    q_lower = question.lower()
    for intent, words in keywords.items():
        if any(word in q_lower for word in words):
            return intent
    return "general"

def embed_query(text):
    return embedder.encode(text, normalize_embeddings=True).tolist()

def format_context(chunks, metadatas):
    formatted = []
    for i, (chunk, meta) in enumerate(zip(chunks, metadatas), 1):
        doc_id = meta.get('doc_id', f'document_{i}')
        topic = meta.get('topic', 'Career Guidance')
        if len(chunk) > 2000:
            chunk = chunk[:2000] + "..."
        formatted.append(f"[{i}] Document: {doc_id} (Topic: {topic})\n{chunk}")
    return "\n\n".join(formatted)

def extract_images_from_metadatas(metadatas):
    all_images = []
    for meta in metadatas:
        if 'images' in meta and meta['images']:
            if isinstance(meta['images'], str):
                try:
                    imgs = json.loads(meta['images'])
                except:
                    continue
            else:
                imgs = meta['images']
            all_images.extend(imgs)
    seen = set()
    unique_images = []
    for img in all_images:
        path = img.get('path')
        if path and path not in seen:
            seen.add(path)
            unique_images.append(img)
    return unique_images

HONEST_REFUSAL = (
    "I don't have relevant information to answer your question. "
    "Please upload relevant documents or ask about topics covered in my knowledge base: "
    "career guidance, placement preparation, engineering roadmaps, technical skills, "
    "certifications, college rankings, and interview preparation."
)

def answer_question(
    question: str,
    history: list = None,
    profile: dict = None,
    data_loader=None,
    language: str = "en"
) -> dict:
    import time
    t_start = time.time()

    print("\n" + "=" * 80)
    print(f"📝 RAG QUESTION: {question}")
    print(f"🌐 LANGUAGE: {language}")
    print("=" * 80)

    # ---- 1. Classify intent ----
    intent = classify_intent(question)
    print(f"🔍 INTENT: {intent}")

    # ---- 2. Embed query & retrieve chunks ----
    query_vector = embed_query(question)
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=TOP_K
    )

    # ---- 3. HONEST REFUSAL: return immediately if no chunks found ----
    if not results['documents'] or not results['documents'][0]:
        print("⚠️  0 chunks retrieved — returning honest refusal (no LLM call made).")
        return {
            "answer": HONEST_REFUSAL,
            "citations": [],
            "out_of_scope": True,
            "intent": intent,
            "chart_data": None,
            "hallucination_detected": False
        }

    chunks    = results['documents'][0]
    distances = results['distances'][0]
    metadatas = results['metadatas'][0]

    # ---- 4. Detailed logging ----
    print(f"📊 Retrieved {len(chunks)} RAG chunks from ChromaDB.")
    print(f"   Top similarity distance : {distances[0]:.4f}")
    print(f"   Worst distance (last)   : {distances[-1]:.4f}")
    for i, (ch, dist) in enumerate(zip(chunks, distances), 1):
        wc = len(ch.split())
        doc_id = metadatas[i - 1].get('doc_id', '?')
        print(f"   Chunk {i:02d}: {wc:4d} words | dist={dist:.4f} | doc={doc_id}")

    # ---- 5. Filter by relevance threshold ----
    relevant_chunks   = [c for c, d in zip(chunks, distances) if d < RELEVANCE_THRESHOLD]
    relevant_metas    = [m for m, d in zip(metadatas, distances) if d < RELEVANCE_THRESHOLD]
    if not relevant_chunks:
        print(f"⚠️  All {len(chunks)} chunks exceed threshold {RELEVANCE_THRESHOLD} — returning honest refusal.")
        return {
            "answer": HONEST_REFUSAL,
            "citations": [],
            "out_of_scope": True,
            "intent": intent,
            "chart_data": None,
            "hallucination_detected": False
        }

    print(f"✅ {len(relevant_chunks)} chunks passed relevance threshold {RELEVANCE_THRESHOLD}.")
    context_text = format_context(relevant_chunks, relevant_metas)
    images = extract_images_from_metadatas(relevant_metas)

    # ---- 6. Build conversation memory ----
    memory_text = ""
    if history:
        for turn in history[-3:]:
            memory_text += f"User: {turn['user']}\nAssistant: {turn['assistant']}\n"

    profile_text = ""
    if profile:
        profile_text = (
            f"Branch: {profile.get('branch', 'Engineering')}, "
            f"Skills: {', '.join(profile.get('skills', []))}"
        )

    # ---- 7. Format prompt ----
    try:
        final_prompt = SYSTEM_PROMPT_RAG.format(
            language=language,
            context=context_text,
            memory=memory_text or "No previous conversation.",
            profile=profile_text or "No student profile provided.",
            question=question
        )
    except Exception as e:
        print(f"❌ Prompt formatting failed: {e}")
        return {"answer": f"Failed to format prompt: {e}", "citations": [], "out_of_scope": True}

    # ---- 8. Call LLM ----
    try:
        print("⏳ Querying Sarvam LLM with RAG Context...")
        raw_answer = call_llm(
            prompt=final_prompt,
            model="sarvam-105b",
            temperature=0.7,
            max_tokens=2060,
            system_prompt=(
                "You are a specialized RAG career advisor. "
                "Provide direct, grounded answers using ONLY the provided Context documents."
            )
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"answer": f"Technical issue querying AI: {e}", "citations": [], "out_of_scope": True}

    if not raw_answer or not raw_answer.strip():
        return {"answer": "Couldn't generate response. Please try again.", "citations": [], "out_of_scope": True}

    # ---- 9. Build citations ----
    citations = []
    for i, meta in enumerate(relevant_metas[:4], 1):
        citations.append({
            "id": i,
            "doc_id": meta.get("doc_id", "knowledge_base"),
            "topic": meta.get("topic", "Career Guide")
        })

    is_hallucination = detect_hallucination(raw_answer, context_text)
    chart_data = extract_chart_data(raw_answer)
    if chart_data:
        print(f"📊 Found chart data: {chart_data}")

    t_elapsed = time.time() - t_start
    print(f"⏱️  Total RAG orchestration time: {t_elapsed:.2f}s")
    print("✅ Final RAG response prepared. Sending back to client.\n")

    response = {
        "answer": raw_answer,
        "citations": citations,
        "out_of_scope": False,
        "intent": intent,
        "chart_data": chart_data,
        "hallucination_detected": is_hallucination
    }
    if images:
        response["images"] = images
    return response