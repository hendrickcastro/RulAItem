# RUN.md - Instrucciones para Ejecutar y Debuggear

## ⚡ Inicio Rápido (TL;DR)

**Para ejecutar inmediatamente:**
```bash
corepack enable
pnpm install --ignore-scripts
cp .env.example .env
docker-compose -f docker-compose.dev.yml up
```

**Frontend:** http://localhost:3000  
**Estado:** ⚠️ Los scripts npm/pnpm y Docker requieren configuración adicional para workspaces.

## Requisitos del Sistema

- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **Docker** y **Docker Compose** (opcional)

## Configuración Inicial

### 1. Habilitar Corepack y instalar dependencias
```bash
corepack enable
pnpm install --ignore-scripts
```

**✅ SOLUCIÓN APLICADA:**
- `--ignore-scripts` evita errores con `tree-sitter` packages (Python 3.13 compatibility)
- Los tree-sitter packages son opcionales y no afectan la funcionalidad core
- Los scripts con `turbo` y `pnpm exec` requieren configuración adicional
- Docker es la opción más estable para desarrollo

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

**Variables obligatorias:**
- `NEXTAUTH_SECRET` - Generar con: `openssl rand -base64 32`
- `NEXTAUTH_URL=http://localhost:3000`
- `GITHUB_ID` y `GITHUB_SECRET` - Crear OAuth App en GitHub
- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` - Para análisis IA

**Variables opcionales:**
- `FIREBASE_PROJECT_ID` - Para producción
- `PINECONE_API_KEY` - Para búsqueda semántica

## Formas de Ejecutar el Proyecto

### Opción 1: Desarrollo Local ⚠️ (Requiere configuración adicional)

**Estado actual:** Los scripts del proyecto requieren ajustes para funcionar correctamente:
- `turbo` no se encuentra en el PATH
- `pnpm exec` no resuelve los binarios correctamente
- Los workspaces de pnpm necesitan configuración adicional

**Para desarrollo inmediato, necesitas resolver los problemas de workspaces y binarios.**

### Opción 2: Con Docker ⚠️ (Requiere ajustes)

**Estado actual:** Docker se construye exitosamente pero no puede ejecutar las aplicaciones debido a problemas con las rutas de pnpm y binarios.

```bash
# Los contenedores se construyen pero fallan al ejecutarse
docker-compose -f docker-compose.dev.yml up
```

**Problemas identificados:**
- Los binarios de pnpm no están en las rutas correctas dentro del contenedor
- `pnpm exec` no resuelve los paths correctamente
- Los workspaces necesitan configuración adicional para Docker

### Opción 3: Docker Producción

```bash
docker-compose up
```

## 🔧 Pasos Siguientes para Resolver los Problemas

### 1. Configuración de Workspaces
- Revisar y ajustar `turbo.json` para que coincida con la estructura de packages
- Verificar que los nombres en `pnpm-workspace.yaml` coincidan con los package.json

### 2. Scripts de Desarrollo
- Cambiar de `pnpm` a `npm` como package manager principal
- O configurar correctamente `pnpm exec` y las rutas de binarios
- Simplificar los scripts eliminando `turbo` temporalmente

### 3. Docker
- Usar `npm` en lugar de `pnpm` en los Dockerfiles
- O instalar dependencias con scripts habilitados para crear symlinks correctos
- Configurar variables de entorno para las rutas de binarios

### 4. Alternativa Rápida
Mientras resuelves los problemas, puedes trabajar en cada workspace individualmente:
```bash
# Trabajar solo en el frontend
cd apps/web
npm install
npm run dev

# Trabajar solo en el worker
cd services/worker  
npm install
npm run dev
```

## Scripts Disponibles ⚠️

**Nota:** Los scripts requieren configuración adicional para funcionar correctamente.

- `pnpm run dev` - ❌ Ejecutar en modo desarrollo (requiere arreglos)
- `pnpm run build` - ❌ Compilar para producción (requiere arreglos)  
- `pnpm run lint` - ❌ Ejecutar linting (requiere arreglos)
- `pnpm run typecheck` - ❌ Verificar tipos TypeScript (requiere arreglos)
- `pnpm run test` - ❌ Ejecutar tests (requiere arreglos)
- `pnpm run test:e2e` - ❌ Tests end-to-end (requiere arreglos)
- `pnpm run clean` - ❌ Limpiar builds (requiere arreglos)
- `pnpm run format` - ✅ Formatear código (funciona)

**Para desarrollo, usa Docker hasta resolver estos problemas.**

## Debugging

### Debug del Frontend (Next.js)
1. Ejecutar con: `pnpm run dev --filter apps/web`
2. Abrir Chrome DevTools
3. Usar breakpoints en el código

### Debug del Worker Service
1. Agregar `debugger;` en el código
2. Ejecutar: `node --inspect services/worker/src/index.ts`
3. Conectar Chrome DevTools a `chrome://inspect`

### Debug con VS Code
Crear `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

## Puertos Utilizados

- **3000** - Frontend Next.js
- **6379** - Redis
- **4000** - Firebase Emulator UI
- **8080** - Firestore Emulator
- **9099** - Firebase Auth Emulator
- **5001** - Firebase Functions (opcional)
- **5432** - PostgreSQL (desarrollo)
- **6006** - Storybook (opcional)

## Servicios Externos Necesarios

### Firebase (Desarrollo)
Los emuladores se ejecutan automáticamente con Docker Compose.

### Firebase (Producción)
1. Crear proyecto en Firebase Console
2. Descargar `firebase-credentials.json`
3. Configurar `FIREBASE_PROJECT_ID` en `.env`

### GitHub OAuth
1. Ir a GitHub Settings > Developer settings > OAuth Apps
2. Crear nueva OAuth App con URL: `http://localhost:3000`
3. Agregar `GITHUB_ID` y `GITHUB_SECRET` al `.env`

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'distutils'"
Este error ocurre con Python 3.13+ y los packages tree-sitter:
```bash
# Solución: Instalar sin scripts
pnpm install --ignore-scripts
```

### Error: "Module not found"
```bash
pnpm install --ignore-scripts
pnpm run clean
pnpm run build
```

### Error: "Port already in use"
```bash
# Encontrar proceso usando puerto
lsof -i :3000
# Terminar proceso
kill -9 <PID>
```

### Error: Firebase Emulator
```bash
# Instalar Firebase CLI
npm install -g firebase-tools
# Inicializar emuladores
firebase emulators:start
```

### Error: Docker build
```bash
# Limpiar cache Docker
docker system prune -a
# Reconstruir contenedores
docker-compose build --no-cache
```