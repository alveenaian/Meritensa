FROM debian:12

WORKDIR /app

# Configure apt to retry on failure and update package lists
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --fix-missing -o Acquire::Retries=3 \
    curl wget ca-certificates gnupg

# Install Node.js from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --fix-missing -o Acquire::Retries=3 nodejs

# Install build tools and common utilities
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --fix-missing -o Acquire::Retries=3 \
    build-essential \
    vim \
    less \
    iputils-ping \
    sudo \
    rsync \
    man-db \
    netcat-openbsd \
    dnsutils \
    procps \
    lsof \
    tini \
    command-not-found

# Install graphics and image processing libraries
RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --fix-missing -o Acquire::Retries=3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libsecret-1-0

# Clean up apt cache to reduce image size
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm
RUN pnpm set store-dir /app/node_modules/.pnpm-store
