# Docker Compose Configuration Documentation

This document explains the structure and purpose of each component in the `docker-compose.yml` file.

## Overview

The docker-compose configuration defines a multi-container application with the following services:
- Next.js frontend + API
- Worker service
- Redis cache
- Firebase Emulator Suite
- Nginx reverse proxy (optional for production)

## Services

### Web Service
- **Purpose**: Hosts the Next.js frontend and API
- **Dockerfile**: `docker/web.Dockerfile`
- **Port mapping**: 3000:3000
- **Environment variables**:
  - `NODE_ENV=production`
  - `NEXTAUTH_URL=http://localhost:3000`
- **Dependencies**: 
  - redis
  - firebase-emulator
- **Volumes**:
  - Mounts `firebase-credentials.json` for Firebase access

### Worker Service
- **Purpose**: Background processing service
- **Dockerfile**: `docker/worker.Dockerfile`
- **Environment variables**:
  - `NODE_ENV=production`
  - `REDIS_URL=redis://redis:6379`
- **Dependencies**: 
  - redis
  - firebase-emulator
- **Volumes**:
  - Mounts `firebase-credentials.json` for Firebase access
  - Mounts `/tmp/git-repos` for git repository storage

### Redis Service
- **Purpose**: Caching layer
- **Image**: redis:7-alpine
- **Port mapping**: 6379:6379
- **Volume**: `redis_data` for persistence
- **Command**: Redis server with append-only file enabled

### Firebase Emulator Service
- **Purpose**: Local Firebase development environment
- **Image**: gcr.io/firebase-js-sdk/emulator
- **Port mappings**:
  - 4000:4000 (Emulator Suite UI)
  - 8080:8080 (Firestore)
  - 9099:9099 (Authentication)
  - 5001:5001 (Functions - optional)
- **Volumes**:
  - `firebase.json` configuration
  - `firestore.rules` security rules
  - `firebase_data` for persistence
- **Command**: Starts Firebase emulators with host 0.0.0.0

### Nginx Service
- **Purpose**: Reverse proxy for production deployment
- **Image**: nginx:alpine
- **Port mapping**: 80:80
- **Volume**: Mounts nginx configuration file
- **Dependencies**: 
  - web service
- **Profile**: Only runs in production profile

## Volumes

### redis_data
- Purpose: Persistent storage for Redis data

### firebase_data
- Purpose: Persistent storage for Firebase emulator data

## Key Features

1. **Modular Architecture**: Each service runs in its own container with specific responsibilities
2. **Development Environment**: All services can run locally for development
3. **Production Ready**: Includes optional Nginx reverse proxy for production deployment
4. **Database Persistence**: Redis and Firebase data are persisted using volumes
5. **Firebase Development**: Local Firebase emulator suite for testing
6. **Environment Configuration**: Different environments (development, production) can be handled through Docker Compose profiles