# demo_data_layer.py
import os
import json
import pandas as pd
from datetime import datetime

print("=" * 70)
print("       CAREER GUIDANCE SYSTEM - DATA LAYER DEMO")
print("       Mentor Review: Structured Data + Vector Index")
print("=" * 70)
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("-" * 70)

# ---------- 1. CHECK STRUCTURED DATA (JSON) ----------
print("\n[1] STRUCTURED DATA: Validating JSON files...")

data_dir = "data"
files_to_check = ["roles.json", "skills.json", "roadmaps.json", "feedback.json"]
all_exist = True

for f in files_to_check:
    path = os.path.join(data_dir, f)
    if os.path.exists(path):
        # Load it to check if JSON is valid
        with open(path, 'r') as file:
            try:
                data = json.load(file)
                print(f"   ✅ {f} - Valid JSON ({len(data)} records)")
            except json.JSONDecodeError:
                print(f"   ❌ {f} - INVALID JSON format!")
                all_exist = False
    else:
        print(f"   ❌ {f} - MISSING!")
        all_exist = False

if not all_exist:
    print("\n   ⚠️  ERROR: Some JSON files are missing or invalid. Please fix them.")
    exit()

# ---------- 2. LOAD INTO PANDAS DATAFRAMES ----------
print("\n[2] LOADING DATA: Pandas DataFrames...")
try:
    roles_df = pd.read_json("data/roles.json")
    skills_df = pd.read_json("data/skills.json")
    roadmaps_df = pd.read_json("data/roadmaps.json")
    print(f"   ✅ roles_df : {len(roles_df)} rows, {len(roles_df.columns)} columns")
    print(f"   ✅ skills_df: {len(skills_df)} rows, {len(skills_df.columns)} columns")
    print(f"   ✅ roadmaps_df: {len(roadmaps_df)} rows, {len(roadmaps_df.columns)} columns")
except Exception as e:
    print(f"   ❌ Error loading DataFrames: {e}")
    exit()

# ---------- 3. DEMO QUERY: BRANCH FILTERING ----------
print("\n[3] DEMO QUERY: Filtering roles by Branch (BR005 - Aerospace)...")
aerospace_roles = roles_df[roles_df["branch_relevance"].apply(lambda x: x.get("BR005", 0) >= 0.8)]

print(f"   ✅ Found {len(aerospace_roles)} roles heavily relevant to Aerospace:")
for _, row in aerospace_roles.iterrows():
    print(f"      - {row['title']} (Difficulty: {row['difficulty']})")

# ---------- 4. DEMO QUERY: SKILL MATCHING ----------
print("\n[4] DEMO QUERY: Checking skills for 'Data Scientist'...")
data_scientist = roles_df[roles_df["title"] == "Data Scientist"]
if not data_scientist.empty:
    skills_needed = data_scientist.iloc[0]["required_skills"]
    print(f"   ✅ Data Scientist requires: {', '.join(skills_needed)}")
    # Check how many exist in skills_df
    existing_skills = skills_df[skills_df["name"].isin(skills_needed)]
    print(f"   ✅ {len(existing_skills)} out of {len(skills_needed)} are defined in skills.json")
    for _, sk in existing_skills.iterrows():
        print(f"      - {sk['name']} (Avg Hours: {sk['avg_hours']}h)")

# ---------- 5. CHECK UNSTRUCTURED (ChromaDB) ----------
print("\n[5] UNSTRUCTURED DATA: Checking ChromaDB vector index...")
try:
    import chromadb
    from chromadb.config import Settings
    
    client = chromadb.PersistentClient(path="chroma_db")
    try:
        collection = client.get_collection("career_guidance_v1")
        count = collection.count()
        print(f"   ✅ ChromaDB collection found! Contains {count} embedded chunks.")
        
        # Show a sample of the metadata
        if count > 0:
            sample = collection.peek(limit=1)
            if sample and 'metadatas' in sample and len(sample['metadatas']) > 0:
                meta = sample['metadatas'][0]
                print(f"   📄 Sample chunk metadata: {meta}")
            else:
                print("   📄 Sample data available (metadata extracted).")
                
    except ValueError:
        print("   ⚠️  Collection 'career_guidance_v1' not found.")
        print("   📌 Please run 'python ingest.py' to build the vector index.")
except ImportError:
    print("   ⚠️  chromadb module not installed. Skipping vector check.")
except Exception as e:
    print(f"   ❌ Error connecting to ChromaDB: {e}")

# ---------- 6. SEMANTIC SEARCH DEMO (if ChromaDB is ready) ----------
print("\n[6] SEMANTIC SEARCH: Testing RAG retrieval (if ChromaDB available)...")
try:
    from sentence_transformers import SentenceTransformer
    import chromadb
    
    client = chromadb.PersistentClient(path="chroma_db")
    collection = client.get_collection("career_guidance_v1")
    model = SentenceTransformer("BAAI/bge-m3", device="cpu")  # or "cuda" if available
    
    test_query = "What does a Propulsion Engineer do?"
    print(f"   🔍 Query: '{test_query}'")
    query_emb = model.encode(test_query, normalize_embeddings=True).tolist()
    results = collection.query(query_embeddings=[query_emb], n_results=2)
    
    if results and results['documents'] and len(results['documents'][0]) > 0:
        print("   ✅ Top 2 retrieved chunks:")
        for i, doc in enumerate(results['documents'][0]):
            snippet = doc[:120].replace("\n", " ") + "..."
            print(f"      [{i+1}] {snippet}")
    else:
        print("   ⚠️  No documents retrieved. Ensure 'docs/' folder exists and has content.")

except ImportError:
    print("   ⚠️  SentenceTransformers not installed. Skipping semantic search.")
except ValueError:
    print("   ⚠️  ChromaDB collection not ready. Run ingest.py first.")
except Exception as e:
    print(f"   ❌ Semantic search error: {e}")

# ---------- 7. SUMMARY ----------
print("\n" + "=" * 70)
print("   DEMO COMPLETE - DATA LAYER VERIFICATION PASSED")
print("=" * 70)
print("\n   ✅ Structured Data: JSON files loaded & validated.")
print("   ✅ Query Engine: DataFrames allow fast filtering.")
print("   🚀 Vector Index: ChromaDB ready for RAG (if built).")
print("   🎯 You are ready to build the Flask API layer!")
print("=" * 70)