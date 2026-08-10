# Coffee Machine Frontend Dockerfile
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY env.example ./

# Build argument for API URL
ARG REACT_APP_API_BASE_URL=http://localhost:3000
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# NFC bridge (optional — if unset, frontend falls back to ws://localhost:8765)
ARG REACT_APP_NFC_WS_URL=
ENV REACT_APP_NFC_WS_URL=$REACT_APP_NFC_WS_URL
ARG REACT_APP_NFC_TOKEN=
ENV REACT_APP_NFC_TOKEN=$REACT_APP_NFC_TOKEN

# Build the app with a fresh BUILD_ID stamped into every API request URL.
# This ensures old browser caches on kiosk tablets bust on URL change, not just
# via HTTP headers — handy when devices have a poisoned cache from before
# Cache-Control: no-store was rolled out.
RUN export REACT_APP_BUILD_ID=$(date +%s) && \
    echo "Building frontend with REACT_APP_BUILD_ID=$REACT_APP_BUILD_ID" && \
    npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set ownership (nginx user already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
