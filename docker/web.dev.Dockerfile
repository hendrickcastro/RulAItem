FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat git

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

EXPOSE 3000

CMD ["sh", "-c", "cd apps/web && pnpm exec next dev --hostname 0.0.0.0"]