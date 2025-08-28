FROM node:18-alpine

# Install Git and system tools
RUN apk add --no-cache git openssh-client python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json turbo.json ./
COPY services/worker/package*.json ./services/worker/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build shared packages
RUN npm run build --workspace=packages/core
RUN npm run build --workspace=packages/db

# Build worker
WORKDIR /app/services/worker
RUN npm run build

# Create directory for git repos
RUN mkdir -p /tmp/git-repos

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3001

CMD ["npm", "start"]
