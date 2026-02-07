import chromadb
import csv

from chromadb.config import Settings

client = chromadb.Client(
    Settings(persist_directory="./chroma_db")
)

guide = client.get_or_create_collection("Plant_Guide")
reports = client.get_or_create_collection("Reported_Plants")

with open("Plants - Sheet1.csv", newline="") as file:
    next(file)
    reader = csv.DictReader(file)

    name = []
    ids = []
    scientificName = []
    pictureLink = []
    threatLevel = []

    for row in reader:
        name.append(row["Name"])
        ids.append(row["Id"])
        scientificName.append(["Scientific Name"])
        pictureLink.append(["Link to Pic"])
        threatLevel.append(["Threat Level"])
    
    guide.add(ids = ids, name = name, scientificName = scientificName, pictureLink = pictureLink, threatLevel = threatLevel)

