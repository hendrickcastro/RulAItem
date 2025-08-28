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
RUN npm run build --workspace=packages/git-analyzer

WORKDIR /app/services/worker

# Create temp directory for repos
RUN mkdir -p /tmp/git-repos

EXPOSE 3001

CMD ["npm", "start"]