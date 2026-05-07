import cv2
import numpy as np
import torch
from pathlib import Path
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models
import gc

def generate_heatmap(query_path: Path, match_path: Path, out_path: Path):
    """
    Generate a heatmap showing the areas of highest similarity.
    Optimized for 512MB RAM.
    """
    # 1. Lazy load model
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    features = model.features
    features.eval()

    # 2. Load and normalize images
    def load_img(p):
        img = Image.open(p).convert('RGB').resize((224, 224))
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        return transform(img).unsqueeze(0)

    q_tensor = load_img(query_path)
    m_tensor = load_img(match_path)

    # 3. Extract feature maps
    with torch.no_grad():
        q_feats = features(q_tensor) # Shape: [1, 1280, 7, 7]
        m_feats = features(m_tensor)

    # 4. Calculate similarity map
    q_flat = q_feats.squeeze(0).view(1280, -1) 
    m_flat = m_feats.squeeze(0).view(1280, -1)
    q_norm = q_flat / (q_flat.norm(dim=0, keepdim=True) + 1e-8)
    m_norm = m_flat / (m_flat.norm(dim=0, keepdim=True) + 1e-8)
    sim_map = torch.matmul(q_norm.t(), m_norm) 
    heatmap = sim_map.max(dim=1)[0].view(7, 7).numpy()

    # 5. Upscale and colorize
    heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.resize(heatmap, (224, 224))
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    # 6. Blend with original image
    original = cv2.imread(str(query_path))
    original = cv2.resize(original, (224, 224))
    overlay = cv2.addWeighted(original, 0.6, heatmap, 0.4, 0)
    cv2.imwrite(str(out_path), overlay)
    
    # 7. Cleanup
    del model, features, q_feats, m_feats, q_flat, m_flat, q_norm, m_norm, sim_map, heatmap, q_tensor, m_tensor
    gc.collect()
    
    return out_path
