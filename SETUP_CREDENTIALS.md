# 🔐 Configuración Segura de Credenciales

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

Las credenciales de Firebase fueron expuestas. **DEBES HACER ESTO AHORA**:

### 1. 🚨 Revocar Credenciales Expuestas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `agtxia-rulaitem`
3. Ve a **Configuración del proyecto** → **Cuentas de servicio**
4. Encuentra la clave: `firebase-adminsdk-fbsvc@agtxia-rulaitem.iam.gserviceaccount.com`
5. **ELIMÍNALA INMEDIATAMENTE**
6. Genera una **nueva clave** de cuenta de servicio

### 2. 🔑 Configurar Nuevas Credenciales

Edita el archivo `/apps/web/.env.local` con las nuevas credenciales:

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=agtxia-rulaitem
FIREBASE_CLIENT_EMAIL=tu_nuevo_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
TU_NUEVA_CLAVE_PRIVADA_AQUI
-----END PRIVATE KEY-----"

# NextAuth Configuration
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_ID=tu_github_client_id
GITHUB_SECRET=tu_github_client_secret
```

### 3. 🔐 Generar Secreto de NextAuth

Ejecuta este comando para generar un secreto seguro:

```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como `NEXTAUTH_SECRET`.

### 4. 🐙 Configurar GitHub OAuth

1. Ve a [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Click en **"New OAuth App"**
3. Configura:
   - **Application name**: `Kontexto IA - Local Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Guarda `Client ID` y `Client Secret` en tu `.env.local`

### 5. 🚀 Probar la Configuración

```bash
# Instalar dependencias si es necesario
pnpm install

# Ejecutar el servidor de desarrollo
pnpm run dev

# La aplicación debería estar en:
# http://localhost:3000
```

### 6. ✅ Verificar Autenticación

1. Abre `http://localhost:3000`
2. Intenta hacer login con GitHub
3. Si todo funciona, verás tu perfil después del login

## 🛡️ Seguridad Adicional

- ✅ El archivo `firebase-config.json` fue eliminado
- ✅ Se añadió al `.gitignore`
- ✅ Las variables de entorno están protegidas
- ✅ Se configuró Firebase Admin SDK con variables de entorno

## 🆘 Si Algo Falla

1. Revisa los logs en la consola del navegador
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que Firebase y GitHub OAuth estén configurados correctamente
4. Revisa que las credenciales nuevas tengan los permisos correctos

## 📋 Checklist de Seguridad

- [ ] Credenciales antiguas revocadas en Firebase Console
- [ ] Nuevas credenciales generadas y configuradas
- [ ] NEXTAUTH_SECRET generado con openssl
- [ ] GitHub OAuth App creada y configurada
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Aplicación funcionando en modo desarrollo
- [ ] Login con GitHub funcionando correctamente