# Plant ID service

The plant identification model: [BioCLIP 2](https://huggingface.co/imageomics/bioclip-2)
served from a GPU container on [Modal](https://modal.com). Built by Santy7543.

The Next.js app calls it only from `src/server/identify/` (see
[docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md#plant-identification)), and
only for signed-in users, with a rate limit.

## How it works

`app.py` loads the model once per container and precomputes a text embedding
for each species in `species.json`. Each request sends a photo as a base64 data
URL; the reply is a confidence score for every species, highest first:

```json
{ "scores": [{ "name": "Air Potato", "scientificName": "Dioscorea bulbifera", "confidence": 0.93 }] }
```

## The species list

`species.json` is generated from `src/data/plants.ts`, the app's only plant
list. After changing the plant list, regenerate it and redeploy:

```bash
npm run plant-id:species
```

A unit test fails if the two lists differ.

## Deploying

```bash
pip install modal
modal deploy services/plant-id/app.py
```

The endpoint requires a Modal proxy auth token, so nobody else can spend GPU
time with its URL. Create one in the Modal dashboard (Settings -> Proxy Auth
Tokens) and set `MODAL_BIO_CLIP_URL`, `MODAL_PROXY_KEY` and `MODAL_PROXY_SECRET`
in `.env.local` and in the hosting provider.

`test_client.py` sends one sample photo to the deployed endpoint, using the
values in `.env.local`.

## Notes

- Python build files (`__pycache__/`, `*.pyc`, `.venv/`) are ignored by the
  root `.gitignore`. Don't commit them.
- Save `requirements.txt` as UTF-8. PowerShell's `>` writes UTF-16, which Git
  treats as binary, so changes to it can't be reviewed.
