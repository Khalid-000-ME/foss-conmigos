from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import chromadb
from sentence_transformers import SentenceTransformer
import datetime
from datetime import timedelta
from dotenv import load_dotenv
import time
from bs4 import BeautifulSoup

load_dotenv()


app = Flask(__name__)

CORS(app)

mongo_client = MongoClient("mongodb://localhost:27017/")
db = mongo_client["context_db"]
users_collection = db["users"]

chroma_client = chromadb.PersistentClient(path="./vector_db")
collection = chroma_client.get_or_create_collection("user_contexts")

# Load sentence transformer model
encoder = SentenceTransformer("all-MiniLM-L6-v2")



@app.route("/store_context/<user_id>", methods=["POST"])
def store_user_context(user_id):
    try:
        post_body = request.get_json()
        
        print("📩 Received data:", post_body)
        
        prompt = post_body["prompt"]
        response = post_body["response"]
        
        timestamp = datetime.datetime.utcnow().isoformat()
        prompt_id = f"prompt_{user_id}_{int(datetime.datetime.utcnow().timestamp())}"
        response_id = f"response_{user_id}_{int(datetime.datetime.utcnow().timestamp())}"

        # Encode prompt & response separately
        prompt_embedding = encoder.encode(prompt).tolist()
        response = remove_html_tags(response)
        print("The NO-HTML response \n", response)
        
        response_embedding = encoder.encode(response).tolist()

        # Store both embeddings separately
        collection.add(
            ids=[prompt_id, response_id],  # Now storing two IDs
            embeddings=[prompt_embedding, response_embedding],  # One embedding per ID
            metadatas=[
                {"user_id": user_id, "type": "prompt", "text": prompt, "timestamp": timestamp},
                {"user_id": user_id, "type": "response", "text": response, "timestamp": timestamp}
            ]
        )

        # Store reference in MongoDB
        res = users_collection.update_one(
            {"_id": user_id}, 
            {"$push": {"context_ids": {"id": prompt_id, "timestamp": timestamp}}},
            upsert=True
        )
        users_collection.update_one(
            {"_id": user_id}, 
            {"$push": {"context_ids": {"id": response_id, "timestamp": timestamp}}},
            upsert=True
        )

        if res.modified_count == 0 and res.upserted_id is None:
            return jsonify({"message": "Error occurred while storing"}), 400

        return jsonify({"message": "Storing successful"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/get_context/<user_id>", methods=["POST"])
def get_relevant_context(user_id):
    
    post_body = request.get_json()
    
    query = post_body["prompt"]
    
    results = collection.query(
        query_embeddings=[encoder.encode(query).tolist()], 
        n_results=3 # Retrieve top 10 relevant results
    )

    relevant_contexts = []
    for item, meta in zip(results["documents"], results["metadatas"]):
        # Check if meta is a list (e.g., a nested list of metadata dictionaries)
        if isinstance(meta, list):
            if meta and meta[0].get("user_id") == user_id:
                relevant_contexts.append(item)
        else:
            if meta.get("user_id") == user_id:
                relevant_contexts.append(item)
    
    res = results["metadatas"][0] # *[1, 2, 3] ->x, y, z = 1, 2, 3
    
    output_string = ""
    
    for i in range(len(res)):
        output_string += res[i]["type"] + ":\n\n" + res[i]["text"] + "\n\n"
    
    print("🔍 Raw query results:", results)

    return jsonify({"up_str": output_string}), 200


@app.route("/get_ctx_time/<user_id>", methods=["POST"])
def get_contexts_by_time(user_id, query, start_time, end_time):
    
    post_body = request.get_json
    
    query = post_body["query"]
    start_time 
    
    results = collection.query(
        query_embeddings=[encoder.encode(query).tolist()], 
        n_results=10
    )

    # Convert time inputs to datetime
    start_time = datetime.datetime.fromisoformat(start_time)
    end_time = datetime.datetime.fromisoformat(end_time)

    # Filter results based on user_id and timestamp range
    filtered_contexts = []
    for doc, meta in zip(results["documents"], results["metadatas"]):
        context_time = datetime.datetime.fromisoformat(meta["timestamp"])
        if meta["user_id"] == user_id and start_time <= context_time <= end_time:
            filtered_contexts.append({"prompt": meta["prompt"], "response": meta["response"]})

    return filtered_contexts


def prepare_context_for_ai(user_id, query):
    relevant_contexts = get_relevant_context(user_id, query)
    return "\n".join(relevant_contexts)  # Combine retrieved texts for the AI


def remove_html_tags(text):
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text()

if __name__ == '__main__':
    app.run(debug=True, port=5000)