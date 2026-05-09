# Fine-tuning script for MobileNetV2 on sports media dataset
# Trained on Kaggle GPU (T4 x2) — achieved 88% validation accuracy
# Datasets: gpiosenka/sports-classification (100 sports, 14k images)
# To run: execute on Kaggle with GPU enabled
# Output: sports_mobilenet_best.pth + sports_mobilenet_embeddings.pth



import os
# Print exact structure of all input datasets
for dataset in os.listdir('/kaggle/input'):
    print(f"\n=== {dataset} ===")
    for root, dirs, files in os.walk(f'/kaggle/input/{dataset}'):
        level = root.replace(f'/kaggle/input/{dataset}', '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        if level < 2:  # only show 2 levels deep
            for f in files[:3]:  # show first 3 files
                print(f'{indent}  {f}')


import torch
import torchvision.models as models
import torchvision.transforms as transforms
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader, Subset, ConcatDataset, random_split
from torch.optim.lr_scheduler import StepLR
from pathlib import Path
import random

# --- Kaggle dataset paths (no download needed) ---
DATASET_PATHS = [
    "/kaggle/input/datasets/gpiosenka/sports-classification/train",
    "/kaggle/input/datasets/gpiosenka/sports-classification/valid",
    "/kaggle/input/datasets/gpiosenka/sports-classification/test",
]

EPOCHS = 15
BATCH_SIZE = 32
LR = 0.001
MAX_PER_DATASET = 5000  # cap per dataset for balance

transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def is_valid_dataset(ds):
    """Skip datasets with wrong folder structure like test/train as classes."""
    bad_classes = {'test', 'train', 'valid', 'validation'}
    return not any(c in bad_classes for c in ds.classes)

def find_image_folder(base_path):
    base = Path(base_path)
    candidates = [base] + sorted(base.rglob("*"))
    for p in candidates:
        if not p.is_dir():
            continue
        subdirs = [x for x in p.iterdir() if x.is_dir()]
        if len(subdirs) >= 2:
            has_images = any(
                list(s.glob("*.jpg")) + list(s.glob("*.png")) + list(s.glob("*.jpeg"))
                for s in subdirs
            )
            if has_images:
                return str(p)
    return None

# --- Load datasets ---
datasets = []
all_classes = set()

for path in DATASET_PATHS:
    folder = find_image_folder(path)
    if not folder:
        print(f"No valid folder in: {path}")
        continue
    try:
        ds = ImageFolder(folder, transform=transform)
        if not is_valid_dataset(ds):
            print(f"Skipped (wrong structure): {folder} — classes: {ds.classes[:5]}")
            continue
        # Cap size for balance
        indices = random.sample(range(len(ds)), min(MAX_PER_DATASET, len(ds)))
        subset = Subset(ds, indices)
        datasets.append((subset, ds.classes))
        all_classes.update(ds.classes)
        print(f"Loaded: {folder} — {len(subset)} images — {len(ds.classes)} classes")
    except Exception as e:
        print(f"Skipped {folder}: {e}")

if not datasets:
    raise Exception("No datasets loaded.")

num_classes = len(all_classes)
print(f"\nTotal unique classes: {num_classes}")
print(f"Classes: {sorted(all_classes)}")

combined = ConcatDataset([ds for ds, _ in datasets])
train_size = int(0.8 * len(combined))
val_size = len(combined) - train_size
train_set, val_set = random_split(combined, [train_size, val_size])

train_loader = DataLoader(train_set, batch_size=BATCH_SIZE,
                          shuffle=True, num_workers=2, pin_memory=True)
val_loader = DataLoader(val_set, batch_size=BATCH_SIZE,
                        num_workers=2, pin_memory=True)

print(f"Train: {train_size} | Val: {val_size}")

# --- Model ---
model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)

# Unfreeze last 3 blocks for deeper fine-tuning
for param in model.features[:14].parameters():
    param.requires_grad = False
for param in model.features[14:].parameters():
    param.requires_grad = True

model.classifier = torch.nn.Sequential(
    torch.nn.Dropout(0.3),
    torch.nn.Linear(model.last_channel, 512),
    torch.nn.ReLU(),
    torch.nn.BatchNorm1d(512),
    torch.nn.Dropout(0.2),
    torch.nn.Linear(512, num_classes)
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
print(f"\nTraining on: {device}")

optimizer = torch.optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LR, weight_decay=1e-4
)
scheduler = StepLR(optimizer, step_size=5, gamma=0.1)
criterion = torch.nn.CrossEntropyLoss()

# --- Training loop ---
best_accuracy = 0.0

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    for i, (images, labels) in enumerate(train_loader):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        if i % 50 == 0:
            print(f"  Epoch {epoch+1} | Batch {i}/{len(train_loader)} | Loss: {loss.item():.3f}", end="\r")

    scheduler.step()

    # Validation
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)

    accuracy = correct / total * 100
    print(f"\nEpoch {epoch+1}/{EPOCHS} | Loss: {total_loss:.3f} | Val Accuracy: {accuracy:.1f}%")

    if accuracy > best_accuracy:
        best_accuracy = accuracy
        torch.save(model.state_dict(), "/kaggle/working/sports_mobilenet_best.pth")
        print(f"  → Best model saved ({accuracy:.1f}%)")

print(f"\nTraining complete. Best accuracy: {best_accuracy:.1f}%")

# Save embedding version (no classifier head)
model.classifier = torch.nn.Identity()
torch.save(model.state_dict(), "/kaggle/working/sports_mobilenet_embeddings.pth")
print("Embedding model saved: sports_mobilenet_embeddings.pth")
