FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the AI model weights so it doesn't time out on Render/Cloud Run
RUN python -c "import torchvision.models as models; models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)"

COPY . .

# Ensure the temp directory exists
RUN mkdir -p /tmp/dap

EXPOSE 8080

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
