FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio processing if needed (e.g., for librosa/soundfile)
# Force IPv4 and avoid installing recommended packages to prevent hanging during build
RUN mkdir -p /etc/apt/apt.conf.d && echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libsndfile1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["flask", "run", "--host=0.0.0.0"]
