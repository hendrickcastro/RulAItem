# 🚀 Guía de Despliegue - Desarrollo

Esta guía te ayudará a configurar y ejecutar **Kontexto IA** en tu entorno de desarrollo local.

## 📋 Prerrequisitos

### Software Requerido
- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior  
- **Docker**: v20.10+ y Docker Compose v2.0+
- **Git**: v2.30+
- **Mínimo 8GB RAM** (recomendado 16GB)
- **10GB espacio libre** en disco

### Verificar Instalaciones
```bash
node --version    # v18+
npm --version     # v9+
docker --version  # v20.10+
git --version     # v2.30+
```

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone https://github.com/hendrickcastro/kontexto-ia.git
cd kontexto-ia
```

### 2. Instalar Dependencias
```bash
# Instalar dependencias del monorepo
npm install

# Verificar que Turborepo esté instalado
npx turbo --version
```

### 3. Configurar Variables de Entorno

#### Crear archivo `.env`
```bash
cp .env.example .env
```

#### Configurar `.env` con tus valores:
```bash
# Autenticación NextAuth
NEXTAUTH_SECRET=tu_secret_super_seguro_aqui_genera_con_openssl
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth App (crear en: https://github.com/settings/developers)
GITHUB_ID=tu_github_client_id
GITHUB_SECRET=tu_github_client_secret

# Firebase (usar emulator en desarrollo)
FIREBASE_PROJECT_ID=kontexto-dev
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# OpenAI API (opcional para análisis IA)
OPENAI_API_KEY=sk-tu_openai_api_key_aqui

# Anthropic Claude (alternativa a OpenAI)
ANTHROPIC_API_KEY=tu_anthropic_api_key

# Worker & Cache
REDIS_URL=redis://localhost:6379
NODE_ENV=development
LOG_LEVEL=debug

# GitHub Webhook (para desarrollo local usar ngrok)
GITHUB_WEBHOOK_SECRET=tu_webhook_secret

# Configuración de desarrollo
MAX_REPO_SIZE_MB=100
GIT_CLONE_TIMEOUT=60000
```

### 4. Obtener Credenciales

#### GitHub OAuth App
1. Ve a [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Configura:
   - **Application name**: `Kontexto IA Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Guarda `Client ID` y `Client Secret` en tu `.env`

#### OpenAI API Key (Opcional)
1. Ve a [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Agrega créditos a tu cuenta
4. Guarda la key en tu `.env`

## 🐳 Despliegue con Docker (Recomendado)

### Opción 1: Desarrollo Completo con Docker
```bash
# Construir e iniciar todos los servicios
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# O ejecutar en segundo plano
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Opción 2: Solo Servicios Externos
```bash
# Solo Redis, Firebase Emulator, y Nginx
docker-compose up redis firebase-emulator nginx -d
```

### Ver Logs
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f web
docker-compose logs -f worker
docker-compose logs -f redis
```

### Parar Servicios
```bash
# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes (datos)
docker-compose down -v
```

## 💻 Desarrollo Local sin Docker

### 1. Iniciar Servicios Externos
```bash
# Solo Redis y Firebase Emulator
docker-compose up redis firebase-emulator -d
```

### 2. Compilar Packages
```bash
# Construir todos los packages compartidos
npm run build

# O construir en modo watch
npm run dev
```

### 3. Iniciar Aplicaciones en Paralelo

#### Terminal 1 - Frontend (Next.js)
```bash
cd apps/web
npm run dev
# Disponible en http://localhost:3000
```

#### Terminal 2 - Worker Service
```bash
cd services/worker  
npm run dev
# Disponible en http://localhost:3001
```

#### Terminal 3 - Logs (Opcional)
```bash
# Ver logs de development
tail -f services/worker/logs/combined.log
```

## 🔍 Verificación del Despliegue

### 1. Verificar Servicios
```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar salud de servicios
curl http://localhost:3001/health
```

### 2. Acceder a las Interfaces

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Aplicación principal |
| **Worker API** | http://localhost:3001 | API del worker service |
| **Worker Health** | http://localhost:3001/health | Health check |
| **Worker Stats** | http://localhost:3001/stats | Estadísticas de cola |
| **Firebase UI** | http://localhost:4000 | Emulator Suite UI |
| **Firestore** | http://localhost:8080 | Firestore Emulator |

### 3. Probar Funcionalidad Básica

#### Autenticación
1. Ve a http://localhost:3000
2. Click "Iniciar Sesión" 
3. Autoriza con GitHub
4. Deberías ser redirigido al dashboard

#### Worker Service
```bash
# Probar health check
curl http://localhost:3001/health

# Ver estadísticas de cola
curl http://localhost:3001/stats

# Triggear un job manualmente
curl -X POST http://localhost:3001/jobs/trigger \
  -H "Content-Type: application/json" \
  -d '{"type":"analyze_commit","payload":{"test":true}}'
```

## 🛠️ Comandos de Desarrollo

### Turborepo Commands
```bash
# Ejecutar dev en todos los workspaces
npm run dev

# Construir todo el proyecto
npm run build

# Ejecutar linting
npm run lint

# Ejecutar tests
npm run test

# Limpiar builds
npm run clean
```

### Docker Commands
```bash
# Reconstruir imágenes
docker-compose build --no-cache

# Ver recursos utilizados
docker stats

# Limpiar sistema Docker
docker system prune -a
```

### Base de Datos (Firebase Emulator)
```bash
# Exportar datos del emulator
firebase emulators:export ./firebase-backup

# Importar datos al emulator  
firebase emulators:start --import ./firebase-backup
```

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Puerto ya en uso
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :3001
lsof -i :6379

# Matar proceso
kill -9 <PID>
```

#### 2. Error de permisos Docker
```bash
# En macOS/Linux
sudo chown -R $USER:$USER .

# Reiniciar Docker
docker-compose down && docker-compose up
```

#### 3. Error de memoria
```bash
# Limpiar Docker
docker system prune -a

# Aumentar memoria de Docker Desktop a 8GB mínimo
```

#### 4. Firebase Emulator no inicia
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar proyecto
firebase init emulators
```

#### 5. Dependencias no actualizadas
```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
rm -rf */node_modules */package-lock.json
npm install
```

### Logs y Debugging

#### Ver logs específicos
```bash
# Logs de Next.js
docker-compose logs -f web

# Logs de Worker
docker-compose logs -f worker

# Logs de Redis
docker-compose logs -f redis
```

#### Debug Worker Service
```bash
# Ejecutar worker en modo debug
cd services/worker
DEBUG=* npm run dev
```

#### Debug Next.js
```bash
# Ejecutar con debug
cd apps/web  
DEBUG=* npm run dev
```

## 🔄 Workflow de Desarrollo

### 1. Hacer cambios en el código
```bash
# Los cambios se reflejan automáticamente con hot-reload
```

### 2. Ejecutar tests
```bash
# Tests unitarios
npm run test

# Tests específicos de un workspace
npm run test --workspace=apps/web
```

### 3. Verificar calidad de código
```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Formateo
npm run format
```

### 4. Commit cambios
```bash
git add .
git commit -m "feat: descripción del cambio"

# O usando conventional commits
git commit -m "feat(web): add new dashboard component"
```

## 📚 Recursos Adicionales

- **Turborepo**: https://turbo.build/repo/docs
- **Next.js 14**: https://nextjs.org/docs
- **Firebase Emulators**: https://firebase.google.com/docs/emulators
- **Docker Compose**: https://docs.docker.com/compose/
- **Bull Queue**: https://github.com/OptimalBits/bull

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa los logs** de los servicios
2. **Verifica las variables de entorno** 
3. **Consulta la documentación** de las dependencias
4. **Abre un issue** en el repositorio con:
   - Descripción del problema
   - Logs relevantes  
   - Pasos para reproducir
   - Tu sistema operativo y versiones

---

¡Feliz desarrollo! 🚀