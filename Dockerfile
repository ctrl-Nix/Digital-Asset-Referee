# --- Stage 1: Build the React Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the FastAPI Backend ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (ffmpeg for yt-dlp, libgl1 for OpenCV)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy the built React app into the backend static directory
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=7860

# Run the FastAPI server via Uvicorn from the backend folder
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
