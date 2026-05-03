FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including express, bullmq)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code natively since it is plain Javascript
COPY src/ ./src/

# Expose API port
EXPOSE 3000

# Default command starts the Express API
# Workers should override the command in docker-compose or cloud platform
CMD ["npm", "start"]
