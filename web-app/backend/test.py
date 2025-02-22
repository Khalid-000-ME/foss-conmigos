import chromadb

chroma_client = chromadb.PersistentClient(path="./vector_db")
collection = chroma_client.get_collection("user_contexts")

# Retrieve all stored context data
results = collection.get()

print("Stored Contexts:")
for doc, meta in zip(results["documents"], results["metadatas"]):
    print(f"User ID: {meta['user_id']}")
    print(f"Prompt: {meta['type']}")
    print(f"Response: {meta['text']}")
    print(f"Timestamp: {meta['timestamp']}")
    print("-" * 30)