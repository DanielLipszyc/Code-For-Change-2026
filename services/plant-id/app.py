import base64
import json
from pathlib import Path
from io import BytesIO
from PIL import Image
import modal

app = modal.App("swamp-spotter-bioclip")

def download_model():
    import open_clip
    open_clip.create_model_and_transforms("hf-hub:imageomics/bioclip-2")
    open_clip.get_tokenizer("hf-hub:imageomics/bioclip-2")

bioclip_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "torchvision",
        "open_clip_torch",
        "huggingface_hub",
        "pillow",
        "fastapi[standard]",
    )
    .run_function(download_model)  # Pre-bakes weights into disk image
    .add_local_file(Path(__file__).parent / "species.json", "/root/species.json")
)

# The species to score, generated from src/data/plants.ts (npm run plant-id:species).
# The file sits next to this one locally and in the container.
SPECIES_FILE = Path(__file__).parent / "species.json"
SPECIES_LIST = json.loads(SPECIES_FILE.read_text(encoding="utf-8"))

# Negative / out-of-domain distractor prompts to absorb probability mass
# when users upload non-plants, pets, indoor scenes, or generic native foliage.
DISTRACTOR_PROMPTS = [
    "a photo of Felis catus, also known as Domestic Cat",
    "a photo of Canis lupus familiaris, also known as Domestic Dog",
    "a photo of Homo sapiens, also known as Human Person",
    "a photo of Animalia, also known as Wild Animal or Insect",
    "a photo of an indoor floor, wall, furniture, or household object",
    "a photo of pavement, concrete, road, car, or building",
    "a photo of generic tree bark, soil, grass, or unidentifiable forest foliage",
    "a photo of Polypodiopsida, also known as Native Fern",
    "a photo of Pontederia cordata, also known as Pickerelweed",
    "a photo of Sabal palmetto, also known as Cabbage Palm",
    "a photo of Pinus elliottii, also known as Slash Pine",
    "a photo of Quercus virginiana, also known as Live Oak",
    "a photo of Tillandsia usneoides, also known as Spanish Moss",
    "a photo of Vitis rotundifolia, also known as Muscadine Grape",
    "a photo of swamp water, pond surface, mud, or wet soil",
    "a photo of a wooden boardwalk, hiking trail, gravel, or sand",
    "a photo of fallen dead leaves, pine needles, mulch, or tree bark",
    "a photo of Alligator mississippiensis, also known as American Alligator",
    "a photo of Aves, also known as Wild Bird, Heron, or Egret",
    "a photo of Reptilia, also known as Lizard, Snake, or Turtle",
    "a photo of Sciurus carolinensis, also known as Eastern Gray Squirrel",
    "a photo of a human hand, fingers, shoe, or clothing",
    "a photo of a computer screen, smartphone screen, or printed text",
    "a blurry, out-of-focus, overexposed, or completely dark image",
]

@app.cls(
    image=bioclip_image,
    gpu="T4",               # Standard T4 is cost-effective and fits BioCLIP-2
    scaledown_window=600,   # Shuts down after 10 minutes of idle time
)
class PlantClassifier:
    @modal.enter()
    def load_model(self):
        import torch
        import open_clip

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Load BioCLIP 2 from Hugging Face via OpenCLIP
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            "hf-hub:imageomics/bioclip-2"
        )
        self.tokenizer = open_clip.get_tokenizer("hf-hub:imageomics/bioclip-2")
        self.model.to(self.device).eval()

        # Combine target species prompts with distractor prompts
        species_prompts = [
            f"a photo of {s['scientific']}, also known as {s['name']}"
            for s in SPECIES_LIST
        ]
        all_prompts = species_prompts + DISTRACTOR_PROMPTS
        tokens = self.tokenizer(all_prompts).to(self.device)

        with torch.no_grad():
            text_features = self.model.encode_text(tokens)
            self.text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    # requires_proxy_auth: callers must send a Modal proxy auth token (Modal-Key and
    # Modal-Secret headers), so the URL alone can't be used to spend GPU time
    @modal.fastapi_endpoint(method="POST", requires_proxy_auth=True)
    def predict(self, payload: dict):
        import torch

        # Extract base64 image string (compatible with Next.js payload)
        raw_b64 = payload.get("image", "")
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(raw_b64)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            image_features = self.model.encode_image(tensor)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            # 1. Raw cosine similarities (-1.0 to 1.0) BEFORE softmax inflation
            raw_similarities = (image_features @ self.text_features.T)[0]

            # 2. Softmax across BOTH species and distractors
            probs = (100.0 * raw_similarities).softmax(dim=-1)

        num_species = len(SPECIES_LIST)
        species_raw = raw_similarities[:num_species]
        distractor_raw = raw_similarities[num_species:]
        distractor_probs = probs[num_species:]
        # Format scores for each species
        scores = []
        for i, s in enumerate(SPECIES_LIST):
            scores.append({
                "name": s["name"],
                "scientificName": s["scientific"],
                "confidence": round(float(probs[i].item()), 4),
                "rawSimilarity": round(float(species_raw[i].item()), 4),
            })

        # Sort descending by confidence
        scores.sort(key=lambda x: x["confidence"], reverse=True)

        # Find highest distractor probability for debugging
        best_dist_idx = int(distractor_probs.argmax().item())
        return {
            "scores": scores,
            "debug": {
                "maxSpeciesRawSimilarity": round(float(species_raw.max().item()), 4),
                "maxDistractorRawSimilarity": round(float(distractor_raw.max().item()), 4),
                "topDistractorPrompt": DISTRACTOR_PROMPTS[best_dist_idx],
                "topDistractorConfidence": round(float(distractor_probs[best_dist_idx].item()), 4),
            },
        }