FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including express, bullmq)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and startup script
COPY src/ ./src/
COPY start-production.sh ./
RUN chmod +x start-production.sh

# Expose API port
EXPOSE 3000

# Default command starts the Express API
# Workers should override the command in docker-compose or cloud platform
CMD ["npm", "start"]
