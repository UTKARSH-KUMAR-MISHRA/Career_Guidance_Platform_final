import sys
sys.path.append('/home/dethrox/Desktop/hcl/AI-carrer-guidance/backend')
from rag import answer_question

print("Starting rag...")
res = answer_question("what are carrer differnce between AI and ML")
print("Result:", res)
