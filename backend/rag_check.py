from rag import embedder, collection
import json

# Ask the same question that gave "I don't have information"
query = "What does a Propulsion Engineer do?"   # change to your actual question

vec = embedder.encode(query, normalize_embeddings=True).tolist()
results = collection.query(query_embeddings=[vec], n_results=3)

print("\n=== RETRIEVAL RESULTS ===\n")
for i, (doc, dist, meta) in enumerate(zip(results['documents'][0], results['distances'][0], results['metadatas'][0])):
    print(f"Chunk {i+1}:")
    print(f"  Distance: {dist:.4f}   (threshold is 0.9)")
    print(f"  Document: {meta.get('doc_id')}")
    print(f"  Topic:    {meta.get('topic')}")
    print(f"  Preview:  {doc[:200]}...\n")