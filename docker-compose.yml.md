# docker-compose.yml - Documentación

Este archivo `docker-compose.yml` define una configuración de contenedores Docker para ejecutar una aplicación completa con múltiples servicios. La estructura está basada en la versión 3.8 de Docker Compose y permite ejecutar una aplicación Next.js (frontend + API), un worker, Redis, Firebase Emulator Suite y opcionalmente Nginx como proxy inverso.

## Estructura General

El archivo define los siguientes servicios:

1. **web** - Aplicación Next.js (frontend + API)
2. **worker** - Servicio de worker
3. **redis** - Almacenamiento en caché Redis
4. **firebase-emulator** - Suite de emuladores de Firebase
5. **nginx** - Proxy inverso (solo en entornos de producción)

## Descripción Detallada por Servicio

### 1. Servicio `web` (Next.js Frontend + API)

- **Construcción:** Usa el Dockerfile ubicado en `docker/web.Dockerfile` desde el contexto actual (`.`).
- **Puertos expuestos:** 
  - `3000:3000` - Acceso al servidor de desarrollo o producción.
- **Variables de entorno:**
  - `NODE_ENV=production` - Establece el modo de producción.
  - `NEXTAUTH_URL=http://localhost:3000` - URL base para autenticación de NextAuth.
- **Archivos de entorno:** Carga variables desde `.env`.
- **Dependencias:**
  - `redis` (puerto 6379)
  - `firebase-emulator` (puertos 4000, 8080, 9099)
- **Volúmenes:**
  - Monta `firebase-credentials.json` como lectura solo (`/app/firebase-credentials.json`).

### 2. Servicio `worker`

- **Construcción:** Usa el Dockerfile ubicado en `docker/worker.Dockerfile` desde el contexto actual (`.`).
- **Variables de entorno:**
  - `NODE_ENV=production` - Establece el modo de producción.
  - `REDIS_URL=redis://redis:6379` - Conexión al contenedor de Redis.
- **Archivos de entorno:** Carga variables desde `.env`.
- **Dependencias:**
  - `redis` (puerto 6379)
  - `firebase-emulator` (puertos 4000, 8080, 9099)
- **Volúmenes:**
  - Monta `firebase-credentials.json` como lectura solo (`/app/firebase-credentials.json`).
  - Monta `/tmp/git-repos:/tmp/git-repos` para almacenamiento de repositorios.

### 3. Servicio `redis`

- **Imagen:** `redis:7-alpine` - Imagen ligera de Redis.
- **Puertos expuestos:** 
  - `6379:6379` - Puerto estándar de Redis.
- **Volúmenes:**
  - `redis_data:/data` - Persistencia de datos.
- **Comando:** 
  - Ejecuta `redis-server --appendonly yes` para activar el modo append-only (persistencia más segura).

### 4. Servicio `firebase-emulator`

- **Imagen:** `gcr.io/firebase-js-sdk/emulator` - Imagen del emulador de Firebase.
- **Puertos expuestos:**
  - `4000:4000` - Interfaz web del emulador (suite UI).
  - `8080:8080` - Firestore.
  - `9099:9099` - Autenticación (Auth).
  - `5001:5001` - Funciones de Firebase (opcional).
- **Volúmenes:**
  - Monta `firebase.json` y `firestore.rules` desde el directorio local.
  - `firebase_data:/data` - Persistencia de datos del emulador.
- **Comando:** 
  - Ejecuta `firebase emulators:start --host 0.0.0.0` para exponer los emuladores a todas las interfaces.

### 5. Servicio `nginx` (Opcional)

- **Imagen:** `nginx:alpine` - Imagen ligera de Nginx.
- **Puertos expuestos:**
  - `80:80` - Puerto HTTP.
- **Volúmenes:**
  - Monta `./docker/nginx.conf:/etc/nginx/nginx.conf` como configuración de Nginx.
- **Dependencias:**
  - `web` (servicio de Next.js).
- **Perfiles:** 
  - Solo se ejecuta cuando el perfil es `production`.

## Volúmenes

- `redis_data` - Persistencia de datos de Redis.
- `firebase_data` - Persistencia de datos del emulador de Firebase.

## Resumen

Este archivo permite desplegar una aplicación completa con múltiples servicios utilizando Docker Compose:

1. Una aplicación Next.js corriendo en el puerto 3000.
2. Un worker que puede interactuar con Redis y Firebase.
3. Redis como caché y cola de tareas.
4. Firebase Emulator Suite para pruebas locales con Firestore, Authentication y funciones.
5. Opcionalmente, Nginx como proxy inverso si se ejecuta en modo producción.

Este enfoque facilita la creación de entornos de desarrollo y producción consistente, ideal para aplicaciones que requieren múltiples servicios y herramientas de desarrollo como Firebase.