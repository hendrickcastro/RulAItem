# 🏭 Guía de Despliegue - Producción

Esta guía cubre el despliegue de **Kontexto IA** en entornos de producción con alta disponibilidad, seguridad y escalabilidad.

## 📋 Prerrequisitos de Producción

### Infraestructura Mínima
- **CPU**: 4 cores (recomendado 8 cores)
- **RAM**: 16GB (recomendado 32GB)  
- **Almacenamiento**: 100GB SSD
- **Ancho de banda**: 1Gbps
- **OS**: Ubuntu 22.04 LTS, CentOS 8+, Amazon Linux 2

### Servicios Externos Requeridos
- **Firebase Project** (Firestore en producción)
- **Redis Cloud** o Redis auto-hospedado
- **GitHub OAuth App** configurado para producción
- **OpenAI/Anthropic API Keys** con límites de producción
- **Dominio propio** con certificado SSL

## 🏗️ Arquitecturas de Despliegue

### Opción 1: Single Server (Pequeña escala)
```
┌─────────────────────────────────────┐
│           Servidor único            │
├─────────────────────────────────────┤
│ Nginx (Reverse Proxy + SSL)        │
│ Docker Compose                      │
│ ├─ Web App (Next.js)               │
│ ├─ Worker Service                   │
│ ├─ Redis (local)                    │
│ └─ Monitoring                       │
└─────────────────────────────────────┘
```

### Opción 2: Multi-Server (Alta escala)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Load Balancer │  │   Web Servers   │  │     Workers     │
│     (Nginx)     │  │   (Next.js)     │  │   (Node.js)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
    ┌─────────────────────────────────────┐
    │         Servicios Externos          │
    ├─────────────────────────────────────┤
    │ Firebase (Firestore)                │
    │ Redis Cloud/Elasticache             │
    │ OpenAI/Anthropic APIs               │
    │ Monitoring (Grafana/Prometheus)     │
    └─────────────────────────────────────┘
```

## 🌐 Opción 1: Despliegue Single Server

### 1. Configuración del Servidor

#### Instalar Docker y Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

#### Configurar Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Opcional: Solo permitir acceso desde IPs específicas
sudo ufw allow from TU_IP_OFICINA to any port 22
```

### 2. Configuración de Producción

#### Clonar y configurar proyecto
```bash
# Crear usuario para la aplicación
sudo useradd -m -s /bin/bash kontexto
sudo usermod -aG docker kontexto
sudo su - kontexto

# Clonar proyecto
git clone https://github.com/tu-usuario/kontexto-ia.git
cd kontexto-ia

# Crear directorio para datos persistentes
mkdir -p data/{redis,logs,backups}
```

#### Configurar variables de entorno de producción
```bash
# Crear .env.production
cat > .env.production << EOF
# Configuración de Producción
NODE_ENV=production
LOG_LEVEL=info

# URLs de producción
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# GitHub OAuth (configurar para producción)
GITHUB_ID=tu_github_prod_client_id
GITHUB_SECRET=tu_github_prod_client_secret

# Firebase Producción
GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-credentials.json
FIREBASE_PROJECT_ID=tu-proyecto-firebase-prod

# Redis (usar Redis Cloud o ElastiCache)
REDIS_URL=redis://tu-redis-prod-url:6379
REDIS_PASSWORD=tu_redis_password

# APIs de IA (con límites de producción)
OPENAI_API_KEY=sk-tu_openai_prod_key
ANTHROPIC_API_KEY=tu_anthropic_prod_key

# Webhook seguro
GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Configuración de producción
MAX_REPO_SIZE_MB=500
MAX_CONCURRENT_JOBS=10
GIT_CLONE_TIMEOUT=300000

# Rate limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=15

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
EOF
```

### 3. Configuración de SSL con Let's Encrypt

#### Crear configuración Nginx con SSL
```bash
# Crear directorio para configuración
mkdir -p nginx/conf.d nginx/ssl

# Configuración Nginx
cat > nginx/conf.d/kontexto.conf << EOF
upstream nextjs {
    server web:3000;
}

upstream worker {
    server worker:3001;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://tu-dominio.com\$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/tu-dominio.com.crt;
    ssl_certificate_key /etc/nginx/ssl/tu-dominio.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Main app
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Worker API
    location /api/worker/ {
        proxy_pass http://worker/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Webhooks (con rate limiting)
    location /api/webhooks/ {
        limit_req zone=webhook burst=10 nodelay;
        proxy_pass http://nextjs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://nextjs;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=webhook:10m rate=10r/m;
EOF
```

#### Obtener certificado SSL
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar auto-renovación
sudo certbot renew --dry-run
```

### 4. Docker Compose para Producción

#### Crear docker-compose.prod.yml
```bash
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # Nginx con SSL
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - web
      - worker
    restart: unless-stopped
    
  # Next.js App
  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
      target: runner
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./firebase-credentials.json:/app/firebase-credentials.json:ro
      - ./data/logs:/app/logs
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Worker Service  
  worker:
    build:
      context: .
      dockerfile: docker/worker.Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./firebase-credentials.json:/app/firebase-credentials.json:ro
      - ./data/logs:/app/logs
      - /tmp/git-repos:/tmp/git-repos
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis (solo si no usas Redis Cloud)
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD} --appendonly yes
    volumes:
      - ./data/redis:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '0.5'

  # Monitoring con Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    profiles:
      - monitoring

  # Grafana para dashboards
  grafana:
    image: grafana/grafana
    ports:
      - "3333:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=tu_password_grafana
    volumes:
      - ./data/grafana:/var/lib/grafana
    restart: unless-stopped
    profiles:
      - monitoring

volumes:
  redis_data:
  prometheus_data:
  grafana_data:
EOF
```

### 5. Configuración de Firebase Producción

#### Configurar Firebase Project
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init

# Crear service account key
# 1. Ve a Firebase Console > Project Settings > Service Accounts
# 2. Genera nueva clave privada
# 3. Guarda como firebase-credentials.json
```

#### Configurar Firestore Security Rules
```bash
# Subir reglas de seguridad
firebase deploy --only firestore:rules

# Crear indexes
firebase deploy --only firestore:indexes
```

### 6. Despliegue Final

#### Build y despliegue
```bash
# Crear directorio de logs
mkdir -p data/logs

# Construir y desplegar
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f web
docker-compose logs -f worker
```

#### Verificar despliegue
```bash
# Health checks
curl https://tu-dominio.com/health
curl https://tu-dominio.com/api/worker/health

# SSL
curl -I https://tu-dominio.com

# Performance
curl -w "@curl-format.txt" -o /dev/null https://tu-dominio.com
```

## ☁️ Opción 2: Despliegue en Cloud

### AWS (Recomendado)

#### Servicios AWS utilizados
- **ECS/Fargate**: Containers
- **RDS**: PostgreSQL (alternativa a Firestore)
- **ElastiCache**: Redis
- **Application Load Balancer**: Load balancing
- **Route 53**: DNS
- **Certificate Manager**: SSL
- **CloudWatch**: Monitoring

#### Terraform para infraestructura
```hcl
# main.tf
provider "aws" {
  region = "us-east-1"
}

# ECS Cluster
resource "aws_ecs_cluster" "kontexto" {
  name = "kontexto-cluster"
}

# Application Load Balancer
resource "aws_lb" "kontexto" {
  name               = "kontexto-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}

# RDS PostgreSQL
resource "aws_db_instance" "kontexto" {
  identifier = "kontexto-db"
  engine     = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "kontexto"
  username = "kontexto_user"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.kontexto.name
  
  skip_final_snapshot = true
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "kontexto" {
  cluster_id           = "kontexto-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.kontexto.name
  security_group_ids   = [aws_security_group.redis.id]
}
```

#### Desplegar en AWS
```bash
# Instalar Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Configurar AWS CLI
aws configure

# Desplegar infraestructura
terraform init
terraform plan
terraform apply

# Desplegar aplicación
aws ecs update-service --cluster kontexto-cluster --service web-service --force-new-deployment
```

### Google Cloud Platform

#### Servicios GCP utilizados
- **Cloud Run**: Containers serverless
- **Firebase**: Database nativo
- **Cloud Redis**: Cache
- **Cloud Load Balancing**: Load balancer
- **Cloud DNS**: DNS management

#### Deploy a Cloud Run
```bash
# Configurar gcloud
gcloud auth login
gcloud config set project tu-project-id

# Build y deploy web app
gcloud builds submit --tag gcr.io/tu-project-id/kontexto-web
gcloud run deploy kontexto-web \
  --image gcr.io/tu-project-id/kontexto-web \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build y deploy worker
gcloud builds submit --tag gcr.io/tu-project-id/kontexto-worker
gcloud run deploy kontexto-worker \
  --image gcr.io/tu-project-id/kontexto-worker \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated
```

### Digital Ocean

#### Droplet con Docker
```bash
# Crear droplet
doctl compute droplet create kontexto-prod \
  --size s-4vcpu-8gb \
  --image ubuntu-22-04-x64 \
  --region nyc1 \
  --ssh-keys tu-ssh-key-id

# Configurar dominio
doctl compute domain create tu-dominio.com
doctl compute domain records create tu-dominio.com \
  --record-type A \
  --record-name @ \
  --record-data IP_DEL_DROPLET
```

## 📊 Monitoring y Observabilidad

### Configurar Prometheus + Grafana
```bash
# Crear configuración Prometheus
mkdir -p monitoring

cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'kontexto-web'
    static_configs:
      - targets: ['web:3000']
  
  - job_name: 'kontexto-worker'
    static_configs:
      - targets: ['worker:3001']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Iniciar monitoring stack
docker-compose --profile monitoring up -d
```

### Dashboards Grafana
1. Accede a http://tu-dominio.com:3333
2. Login: admin / tu_password_grafana
3. Importa dashboards:
   - Node.js Application Dashboard
   - Redis Dashboard
   - Docker Dashboard

### Alertas importantes
- Alta utilización CPU (>80%)
- Alta utilización memoria (>90%)
- Cola de trabajos muy grande (>1000)
- Rate de errores alto (>5%)
- Tiempo de respuesta lento (>2s)

## 🔒 Seguridad en Producción

### Checklist de seguridad
- ✅ SSL/TLS configurado
- ✅ Variables de entorno seguras
- ✅ Firewall configurado
- ✅ Rate limiting activo
- ✅ Security headers configurados
- ✅ Logs de seguridad activos
- ✅ Updates automáticos del sistema
- ✅ Backups regulares
- ✅ Monitoring de seguridad

### Configurar updates automáticos
```bash
# Ubuntu
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Configurar auto-updates de containers
# Usar Watchtower
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --schedule "0 0 4 * * *" \
  --cleanup
```

## 📁 Backup y Recuperación

### Backup automático
```bash
# Script de backup
cat > scripts/backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/kontexto/backups"

# Crear directorio
mkdir -p \$BACKUP_DIR/\$DATE

# Backup Firebase
# (usar Firebase Admin SDK para export)

# Backup Redis
docker exec kontexto_redis_1 redis-cli --rdb /data/dump_\$DATE.rdb

# Backup código y configuración
tar -czf \$BACKUP_DIR/\$DATE/app_backup.tar.gz \\
  --exclude=node_modules \\
  --exclude=.git \\
  --exclude=data \\
  /home/kontexto/kontexto-ia

# Limpiar backups antiguos (30 días)
find \$BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed: \$DATE"
EOF

chmod +x scripts/backup.sh

# Programar backup diario
(crontab -l 2>/dev/null; echo "0 2 * * * /home/kontexto/kontexto-ia/scripts/backup.sh") | crontab -
```

### Plan de recuperación
1. **Instalar dependencias** en servidor nuevo
2. **Restaurar código** desde backup o Git
3. **Configurar variables** de entorno
4. **Restaurar base de datos** desde backup
5. **Restaurar Redis** si necesario
6. **Iniciar servicios** con Docker Compose
7. **Verificar funcionamiento** completo

## 📈 Escalabilidad

### Horizontal scaling
```bash
# Escalar servicios
docker-compose up --scale web=3 --scale worker=5 -d

# Load balancer automático con nginx
# (configuración incluida en nginx.conf)
```

### Vertical scaling
```bash
# Aumentar recursos en docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 8G
      cpus: '4.0'
```

### Database scaling
- **Firestore**: Escalado automático
- **Redis**: Usar Redis Cluster para grandes volúmenes
- **Considerar sharding** para repositorios grandes

## 🔍 Troubleshooting Producción

### Logs centralizados
```bash
# Ver todos los logs
docker-compose logs -f --tail=100

# Logs específicos por fecha
docker-compose logs --since="2024-01-01T00:00:00" web

# Seguir logs en tiempo real
docker-compose logs -f web worker
```

### Comandos de diagnóstico
```bash
# Estado de contenedores
docker-compose ps

# Uso de recursos
docker stats

# Health checks
curl -f https://tu-dominio.com/health

# Performance de base de datos
# (usar Firebase Console o herramientas de monitoring)

# Verificar conectividad
docker-compose exec web ping redis
docker-compose exec worker curl -f http://web:3000/health
```

### Reinicio de servicios
```bash
# Reinicio graceful
docker-compose restart web worker

# Reinicio completo
docker-compose down && docker-compose up -d

# Reinicio con rebuild
docker-compose up --build --force-recreate -d
```

---

## 📞 Soporte Producción

Para problemas en producción:

1. **Verificar health checks** de todos los servicios
2. **Revisar logs** de error inmediatamente
3. **Verificar métricas** en Grafana
4. **Comprobar conectividad** entre servicios
5. **Revisar recursos** del servidor (CPU, RAM, Disco)

**🚨 En caso de emergencia:**
- Mantén calmado y documenta el problema
- Implementa rollback si es necesario
- Contacta al equipo técnico con logs relevantes

¡Tu aplicación **Kontexto IA** está lista para producción! 🎉