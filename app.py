import os
import json
import torch
import numpy as np
from PIL import Image
from faiss import read_index
import clip

class App:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        self.model.eval()
        self.index = read_index(os.path.join("static", "index.faiss"))
        with open(os.path.join("static", "image_paths.json")) as f:
            self.image_paths = json.load(f)

    def _preprocess_image(self, image):
        return self.preprocess(image).to(self.device)

    def _search_index(self, query_features, results):
        distances, indices = self.index.search(query_features, results)
        return [{
            'path': self.image_paths[idx],
            'score': float(distances[0][i])
        } for i, idx in enumerate(indices[0])]

    def search_by_text(self, search_text, results=5):
        text_tokens = clip.tokenize([search_text]).to(self.device)
        with torch.no_grad():
            text_features = self.model.encode_text(text_tokens).float()
        text_features /= text_features.norm(dim=-1, keepdim=True)
        text_features = text_features.cpu().numpy()
        return self._search_index(text_features, results)

    def search_by_image(self, image_path, results=5):
        image = Image.open(image_path).convert("RGB")
        image_input = self._preprocess_image(image).unsqueeze(0)
        with torch.no_grad():
            image_features = self.model.encode_image(image_input).float()
        image_features /= image_features.norm(dim=-1, keepdim=True)
        image_features = image_features.cpu().numpy()
        return self._search_index(image_features, results)

    def run(self):
        while True:
            pass

    
    def _display_results(self, results):
        pass


if __name__ == "__main__":
    app = App()
    app.run()
