# Use official lightweight Node.js LTS Alpine image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests first for efficient Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy server and client source files
COPY server/ ./server/
COPY client/ ./client/

# Expose dynamic Cloud Run container port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application server
CMD ["node", "server/server.js"]
