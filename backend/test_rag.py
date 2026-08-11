# backend/test_rag.py
from rag import answer_question

def run_tests():
    print("="*60)
    print("🧪 TESTING RAG LAYER (New Enriched Data)")
    print("="*60)
    
    # Test 1: Old data (still works)
    print("\n[TEST 1] Asking: 'What does a Propulsion Engineer do?'")
    result = answer_question("What does a Propulsion Engineer do?")
    print(f"Out of Scope: {result['out_of_scope']}")
    print(f"Answer: {result['answer'][:150]}...")

    # Test 2: NEW DATA - Certifications
    print("\n[TEST 2] Asking: 'Which certifications are best for a Cloud Engineer?'")
    result = answer_question("Which certifications are best for a Cloud Engineer?")
    print(f"Out of Scope: {result['out_of_scope']}")
    print(f"Answer: {result['answer'][:150]}...")

    # Test 3: NEW DATA - Colleges
    print("\n[TEST 3] Asking: 'What are the top colleges for CSE in India?'")
    result = answer_question("What are the top colleges for CSE in India?")
    print(f"Out of Scope: {result['out_of_scope']}")
    print(f"Answer: {result['answer'][:150]}...")

if __name__ == "__main__":
    run_tests()