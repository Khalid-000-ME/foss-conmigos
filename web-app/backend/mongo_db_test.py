from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")  # Default MongoDB URI

# Create (or connect to) a database
db = client["my_database"]

# Create (or connect to) a collection (table equivalent)
collection = db["my_collection"]

# Sample data to insert
data = {
    "name": "John Doe",
    "age": 25,
    "email": "johndoe@example.com"
}

# Insert data into MongoDB
inserted_id = collection.insert_one(data).inserted_id
print(f"✅ Data inserted with ID: {inserted_id}")

# Retrieve and display data
print("🔍 Retrieving Data:")
for doc in collection.find():
    print(doc)