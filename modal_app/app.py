import base64
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
)

# Target species corresponding to your app's catalog
SPECIES_LIST = [
    {"name": "Air Potato", "scientific": "Dioscorea bulbifera"},
    {"name": "Coral Ardisia", "scientific": "Ardisia crenata"},
    {"name": "Torpedo Grass", "scientific": "Panicum repens"},
    {"name": "Wedelia", "scientific": "Sphagneticola trilobata"},
    {"name": "Caesar's Weed", "scientific": "Urena lobata"},
    {"name": "Small Leaf Spiderwort", "scientific": "Tradescantia fluminensis"},
    {"name": "Wild Taro", "scientific": "Colocasia esculenta"},
    {"name": "Japanese Climbing Fern", "scientific": "Lygodium japonicum"},
    {"name": "Chinese Tallow", "scientific": "Triadica sebifera"},
    {"name": "Camphor Tree", "scientific": "Cinnamomum camphora"},
    {"name": "Mimosa", "scientific": "Albizia julibrissin"},
    {"name": "Shrub Lantana", "scientific": "Lantana camara"},
    {"name": "Boston Fern", "scientific": "Nephrolepis exaltata"},
    {"name": "Winged Yam", "scientific": "Dioscorea alata"},
    {"name": "Tropical Soda Apple", "scientific": "Solanum viarum"},
    {"name": "Cogon Grass", "scientific": "Imperata cylindrica"},
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

        # Precompute text embeddings so inference remains fast
        text_prompts = [
            f"a photo of {s['scientific']}, also known as {s['name']}"
            for s in SPECIES_LIST
        ]
        tokens = self.tokenizer(text_prompts).to(self.device)
        
        with torch.no_grad():
            text_features = self.model.encode_text(tokens)
            self.text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    @modal.fastapi_endpoint(method="POST")
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

            # Compute similarity logits and softmax probabilities
            similarity = (100.0 * image_features @ self.text_features.T).softmax(dim=-1)[0]

        # Format scores for each species
        scores = []
        for i, s in enumerate(SPECIES_LIST):
            scores.append({
                "name": s["name"],
                "scientificName": s["scientific"],
                "confidence": round(float(similarity[i].item()), 4)
            })

        # Sort descending by confidence
        scores.sort(key=lambda x: x["confidence"], reverse=True)
        return {"scores": scores}