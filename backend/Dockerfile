FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio processing if needed (e.g., for librosa/soundfile)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["flask", "run", "--host=0.0.0.0"]
