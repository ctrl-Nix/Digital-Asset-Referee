import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from pathlib import Path
import gc

_model = None

def get_model():
    """Lazy load the model to save RAM."""
    global _model
    if _model is None:
        # Load the base MobileNetV2
        _model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        _model.classifier = torch.nn.Identity()
        _model.eval()
        
        # Check for fine-tuned weights (Optional)
        weights_path = Path(__file__).parent.parent / "sports_mobilenet_embeddings.pth"
        if weights_path.exists():
            try:
                _model.load_state_dict(torch.load(weights_path, map_location="cpu"))
            except Exception as e:
                print(f"Warning: Could not load fine-tuned weights: {e}")
                
    return _model

def generate_embedding(image_path: Path) -> list[float]:
    """Generate embedding with strict memory management for Free Tiers."""
    model = get_model()
    
    transform = transforms.Compose([
        transforms.Resize((128, 128)), # RAM-friendly resolution
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    try:
        img = Image.open(image_path).convert("RGB")
        tensor = transform(img).unsqueeze(0)
        
        with torch.no_grad():
            vec = model(tensor).squeeze().numpy()
        
        # Immediate cleanup
        del tensor
        gc.collect()
        
        return vec.tolist()
    except Exception as e:
        print(f"Embedding generation error: {e}")
        return [0.0] * 1280

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    import numpy as np
    a, b = np.array(vec1), np.array(vec2)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b + 1e-9))
