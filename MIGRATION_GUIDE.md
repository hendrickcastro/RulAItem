# 🚀 Guía de Migración a la Nueva Arquitectura

## 📋 Resumen de Cambios

La nueva arquitectura del proyecto RulAItem se basa en:
- **Separación de responsabilidades** por dominio
- **Componentes reutilizables** con design system
- **Hooks personalizados** para lógica de estado
- **Servicios centralizados** para lógica de negocio
- **Middleware composable** para API routes

## 🗂️ Nueva Estructura de Archivos

```
apps/web/
├── app/                          # Next.js App Router (sin cambios)
├── components/                   # ✨ NUEVO - Componentes organizados
│   ├── ui/                      # Componentes base del design system
│   ├── layout/                  # Header, Footer, Sidebar, etc.
│   ├── analysis/                # Componentes específicos de análisis
│   ├── contexts/                # Componentes específicos de contextos
│   └── common/                  # Componentes comunes
├── lib/                         # ✨ NUEVO - Lógica centralizada
│   ├── api/                     # Cliente API y middleware
│   ├── hooks/                   # Custom hooks
│   ├── services/                # Lógica de negocio
│   ├── utils/                   # Utilidades
│   ├── validations/             # Esquemas de validación
│   └── constants/               # Constantes
├── types/                       # ✨ NUEVO - Tipos TypeScript
└── styles/                      # Estilos globales
```

## 🔄 Plan de Migración

### Fase 1: Configuración Base ✅

```bash
# Crear estructura de carpetas
mkdir -p apps/web/components/{ui,layout,forms,analysis,contexts,common}
mkdir -p apps/web/lib/{api,hooks,services,utils,validations,constants}
mkdir -p apps/web/types
```

### Fase 2: Migración de Componentes

#### 2.1 Identificar Componentes Reutilizables

**Componentes actuales para extraer:**
- ✅ `LoadingSpinner` → `components/ui/LoadingSpinner`
- ✅ `StatsCard` → `components/ui/StatsCard` 
- ✅ `StatusBadge` → `components/ui/StatusBadge`
- 🔄 `ContextCard` → `components/contexts/ContextCard`
- 🔄 `AnalysisJobCard` → `components/analysis/AnalysisJobCard`

#### 2.2 Refactorizar Páginas

**Antes:**
```typescript
// ❌ 300+ líneas con lógica mezclada
export default function ContextosPage() {
  const [contexts, setContexts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // ... 50+ líneas de estado y lógica
}
```

**Después:**
```typescript
// ✅ Limpio y enfocado
export default function ContextosPage() {
  const { contexts, isLoading, fetchContexts } = useContexts();
  const { jobs, startAnalysis } = useAnalysis();
  
  // Solo JSX y lógica de presentación
}
```

### Fase 3: Servicios y Hooks

#### 3.1 Crear Servicios

```typescript
// ✅ lib/services/contextsService.ts
export const contextsService = new ContextsService();

// ✅ lib/services/analysisService.ts  
export const analysisService = new AnalysisService();

// ✅ lib/services/githubService.ts
export const githubService = new GitHubService();
```

#### 3.2 Crear Hooks Personalizados

```typescript
// ✅ lib/hooks/useContexts.ts
export function useContexts() {
  // Estado y acciones para contextos
}

// ✅ lib/hooks/useAnalysis.ts
export function useAnalysis() {
  // Estado y acciones para análisis
}
```

### Fase 4: API Routes Optimization

#### 4.1 Middleware Composable

```typescript
// ✅ lib/api/middleware.ts
export const compose = (...middlewares) => (handler) => 
  middlewares.reduceRight((acc, mw) => mw(acc), handler);
```

#### 4.2 Route Handlers Refactorizados

```typescript
// ✅ Nuevo patrón para API routes
const protectedHandler = compose(
  withErrorHandling,
  withRateLimit(100),
  withAuth
);

export const GET = protectedHandler(getContexts);
export const POST = protectedHandler(createContext);
```

## 📦 Importaciones Actualizadas

### Antes
```typescript
import { Button } from '@kontexto/ui';
// Lógica mezclada en componentes
```

### Después
```typescript
// Componentes UI
import { Button, LoadingSpinner, StatsCard } from '@/components/ui';

// Componentes de dominio
import { ContextCard } from '@/components/contexts';
import { AnalysisJobCard } from '@/components/analysis';

// Hooks y servicios
import { useContexts, useAnalysis } from '@/lib/hooks';
import { contextsService } from '@/lib/services';

// Tipos
import type { Context, AnalysisJob } from '@/types';

// Constantes
import { JOB_STATUSES, ERROR_MESSAGES } from '@/lib/constants';
```

## 🧪 Testing Strategy

### Componentes
```typescript
// Testear componentes aislados
test('ContextCard displays context info', () => {
  render(<ContextCard context={mockContext} />);
  expect(screen.getByText(mockContext.nombre)).toBeInTheDocument();
});
```

### Hooks
```typescript
// Testear hooks con renderHook
test('useContexts fetches contexts', async () => {
  const { result } = renderHook(() => useContexts());
  await act(() => result.current.fetchContexts());
  expect(result.current.contexts).toHaveLength(2);
});
```

### Servicios
```typescript
// Testear servicios como funciones puras
test('contextsService.parseFormData formats correctly', () => {
  const formData = { tags: 'react, typescript' };
  const result = contextsService.parseFormData(formData);
  expect(result.tags).toEqual(['react', 'typescript']);
});
```

## 🎯 Checklist de Migración

### Por Página/Componente:

- [ ] **Página de Contextos**
  - [x] Extraer `ContextCard` component
  - [x] Implementar `useContexts` hook
  - [ ] Migrar lógica a servicios
  - [ ] Refactorizar JSX

- [ ] **Página de Estado de Análisis**
  - [x] Extraer `AnalysisJobCard` component
  - [x] Implementar `useAnalysis` hook
  - [ ] Migrar lógica a servicios
  - [ ] Refactorizar JSX

- [ ] **API Routes**
  - [x] Implementar middleware composable
  - [ ] Migrar `/api/contextos`
  - [ ] Migrar `/api/analysis/*`
  - [ ] Agregar rate limiting

### Validación:

- [ ] **Funcionalidad**
  - [ ] Todas las features funcionan igual
  - [ ] No hay regresiones
  - [ ] Performance mantenida/mejorada

- [ ] **Code Quality**
  - [ ] Menor duplicación de código
  - [ ] Mejor separación de responsabilidades
  - [ ] Más componentes reutilizables

## 🚀 Próximos Pasos

1. **Completar migración gradual** de páginas existentes
2. **Agregar tests** para nuevos componentes y hooks
3. **Implementar Storybook** para documentar componentes
4. **Optimizar bundle size** con lazy loading
5. **Mejorar TypeScript** coverage y type safety

## 📈 Métricas de Éxito

- **Reducción de código duplicado**: Objetivo 60%
- **Aumento en reutilización**: 15+ componentes reutilizables
- **Mejor mantenibilidad**: Componentes < 200 líneas
- **Performance**: Sin regresiones en Core Web Vitals
- **Developer Experience**: Setup time < 5 minutos

## 🆘 Troubleshooting

### Problemas Comunes:

1. **Import errors**: Verificar path aliases en `tsconfig.json`
2. **Type errors**: Importar tipos desde `@/types`
3. **Hook dependencies**: Agregar useCallback para evitar re-renders
4. **Service errors**: Verificar manejo de errores en servicios

### Herramientas de Debug:

- React DevTools para componentes
- Network tab para API calls
- TypeScript errors en IDE
- Console logs para servicios