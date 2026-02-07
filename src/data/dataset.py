import chromadb
import csv
import os
base_dir = os.path.dirname(__file__)  

file_path = os.path.join(base_dir, "Plants.csv")

from chromadb.config import Settings

client = chromadb.Client(
    Settings(persist_directory="./chroma_db")
)

guide = client.get_or_create_collection("Plant_Guide")
reports = client.get_or_create_collection("Reported_Plants")

headers = ["ID", "Common Name", "Scientific Name", "Image URL", "Risk Level"]


with open(file_path, newline="", encoding="utf-8") as file:
    next(file)  # skip first line (the top categories)
    reader = csv.DictReader(file, fieldnames=headers)

    documents = []
    ids = []
    metadatas = []

    for row in reader:
        documents.append(row["Common Name"])
        ids.append(row["Common Name"].lower().replace(" ", "_"))
        metadatas.append({
            "common_name": row["Common Name"],
            "scientific_name": row["Scientific Name"],
            "image_url": row["Image URL"],
            "risk_level": row["Risk Level"]
        })

    guide.add(
        documents=documents,
        ids=ids,
        metadatas=metadatas
    )
