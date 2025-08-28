FROM node:18-alpine

# Install Git and system tools
RUN apk add --no-cache git openssh-client python3 make g++

WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable
RUN corepack prepare pnpm@8.15.0 --activate

# Copy package files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./

# Copy workspace source files
COPY apps ./apps
COPY packages ./packages
COPY services ./services

# Install dependencies with ignore-scripts to avoid tree-sitter issues
RUN pnpm install --ignore-scripts --frozen-lockfile

# Create temp directory for repos
RUN mkdir -p /tmp/git-repos

EXPOSE 3001

CMD ["sh", "-c", "cd services/worker && node --import tsx/esm --watch src/index.ts"]