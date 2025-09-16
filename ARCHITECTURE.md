# 🏗️ Arquitectura del Proyecto RulAItem

## 📋 Análisis Actual

### Problemas Identificados:
1. **Componentes monolíticos** - Páginas con demasiada lógica mezclada
2. **Lógica de negocio dispersa** - API calls mezclados con UI
3. **Componentes no reutilizables** - Mucha duplicación de código
4. **Falta de separación de responsabilidades** - Todo mezclado en componentes de página
5. **Tipos y constantes dispersos** - Sin organización centralizada

## 🎯 Nueva Arquitectura Propuesta

### 1. Estructura de Carpetas Mejorada

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups
│   ├── (dashboard)/
│   └── api/
├── components/                   # Componentes organizados por dominio
│   ├── ui/                      # Componentes base reutilizables
│   ├── layout/                  # Componentes de layout
│   ├── forms/                   # Componentes de formularios
│   ├── analysis/                # Componentes específicos de análisis
│   ├── contexts/                # Componentes específicos de contextos
│   └── common/                  # Componentes comunes
├── lib/                         # Utilidades y configuraciones
│   ├── api/                     # Cliente API y endpoints
│   ├── hooks/                   # Custom hooks
│   ├── services/                # Lógica de negocio
│   ├── utils/                   # Utilidades generales
│   ├── validations/             # Esquemas de validación
│   └── constants/               # Constantes de la aplicación
├── types/                       # Tipos TypeScript
└── styles/                      # Estilos globales
```

### 2. Separación por Dominios

```
components/
├── ui/                          # Sistema de diseño base
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   ├── Card/
│   ├── Table/
│   └── index.ts
├── layout/
│   ├── Header/
│   ├── Sidebar/
│   ├── Footer/
│   └── Breadcrumbs/
├── analysis/                    # Dominio de análisis
│   ├── AnalysisStatus/
│   ├── AnalysisJobCard/
│   ├── AnalysisControls/
│   └── AnalysisMetrics/
├── contexts/                    # Dominio de contextos
│   ├── ContextCard/
│   ├── ContextForm/
│   ├── ContextList/
│   └── ContextActions/
└── forms/                       # Formularios reutilizables
    ├── ContextForm/
    ├── AnalysisForm/
    └── SearchForm/
```

### 3. Servicios y Lógica de Negocio

```
lib/services/
├── analysisService.ts          # Lógica de análisis
├── contextsService.ts          # Lógica de contextos
├── jobsService.ts              # Lógica de trabajos
├── githubService.ts            # Integración con GitHub
└── authService.ts              # Autenticación
```

### 4. Hooks Personalizados

```
lib/hooks/
├── useAnalysis.ts              # Estado y acciones de análisis
├── useContexts.ts              # Estado y acciones de contextos
├── useJobs.ts                  # Estado y acciones de trabajos
├── useGitHub.ts                # Integración con GitHub
└── useDebounce.ts              # Utilidades
```

## 🔄 Plan de Refactorización

### Fase 1: Componentes Base UI
- [x] Extraer componentes reutilizables del package ui
- [ ] Crear sistema de diseño consistente
- [ ] Implementar variantes y temas

### Fase 2: Separación de Dominios
- [ ] Extraer componentes de análisis
- [ ] Extraer componentes de contextos
- [ ] Crear componentes de layout

### Fase 3: Servicios y Estado
- [ ] Crear servicios de negocio
- [ ] Implementar hooks personalizados
- [ ] Centralizar manejo de errores

### Fase 4: Tipos y Validaciones
- [ ] Centralizar tipos TypeScript
- [ ] Implementar validaciones con Zod
- [ ] Mejorar type safety

### Fase 5: Optimización
- [ ] Implementar lazy loading
- [ ] Optimizar bundle size
- [ ] Mejorar performance

## 📦 Beneficios Esperados

1. **Mantenibilidad** - Código más fácil de mantener y extender
2. **Reutilización** - Componentes reutilizables en todo el proyecto
3. **Testing** - Más fácil testear componentes aislados
4. **Performance** - Mejor optimización y lazy loading
5. **Escalabilidad** - Estructura que crece con el proyecto
6. **Developer Experience** - Mejor organización y navegación del código

## 🛠️ Herramientas y Convenciones

### Naming Conventions:
- **Componentes**: PascalCase (`AnalysisJobCard`)
- **Archivos**: kebab-case (`analysis-job-card.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAnalysis`)
- **Servicios**: camelCase con sufijo `Service` (`analysisService`)

### File Structure Pattern:
```
ComponentName/
├── index.ts                    # Export público
├── ComponentName.tsx           # Componente principal
├── ComponentName.types.ts      # Tipos específicos
├── ComponentName.styles.ts     # Estilos (si necesario)
└── ComponentName.test.tsx      # Tests
```

### Import Organization:
```typescript
// 1. External libraries
import React from 'react'
import { NextPage } from 'next'

// 2. Internal packages
import { Button } from '@kontexto/ui'

// 3. App imports
import { useAnalysis } from '@/lib/hooks'
import { AnalysisCard } from '@/components/analysis'

// 4. Relative imports
import './styles.css'
```

## 🎯 Siguientes Pasos

1. Comenzar con la refactorización de componentes UI más usados
2. Extraer lógica de negocio a servicios
3. Implementar hooks personalizados
4. Migrar gradualmente las páginas existentes
5. Añadir tests para los nuevos componentes
6. Documentar componentes con Storybook (opcional)

Esta arquitectura permitirá un crecimiento sostenible del proyecto manteniendo la calidad del código y la experiencia de desarrollo.