import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { contextosRepository, usersRepository, commitsRepository, analysisRepository } from '@kontexto/db';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get recent commits from GitHub API
async function getRecentCommitsFromGitHub(repoUrl: string, accessToken: string) {
  const [, , , owner, repo] = repoUrl.split('/');
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Kontexto-IA-Analysis'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const commits = await response.json();
    
    return commits.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
      },
      date: commit.commit.author.date,
      files: [], // We'll populate this separately if needed
      stats: {
        additions: 0, // We'll get this from individual commit API if needed
        deletions: 0,
      },
      diff: '', // We could get this from GitHub API if needed
    }));
  } catch (error) {
    console.error('Error fetching commits from GitHub:', error);
    throw error;
  }
}

// Function to get commit details including diff from GitHub API
async function getCommitDetails(repoUrl: string, sha: string, accessToken: string) {
  const [, , , owner, repo] = repoUrl.split('/');
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Kontexto-IA-Analysis'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const commit = await response.json();
    
    return {
      files: commit.files ? commit.files.map((f: any) => f.filename) : [],
      stats: {
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
      },
      diff: commit.files ? commit.files.map((f: any) => f.patch).join('\n') : '',
    };
  } catch (error) {
    console.error(`Error fetching commit details for ${sha}:`, error);
    return {
      files: [],
      stats: { additions: 0, deletions: 0 },
      diff: '',
    };
  }
}

// Function to get repository file structure from GitHub API
async function getRepositoryStructure(repoUrl: string, branch: string, accessToken: string) {
  const [, , , owner, repo] = repoUrl.split('/');
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Kontexto-IA-Analysis'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const treeData = await response.json();
    
    // Extract file paths and categorize them
    const files = treeData.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({ path: item.path, sha: item.sha, size: item.size }));

    return files;
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    return [];
  }
}

// Function to get file content from GitHub API
async function getFileContent(repoUrl: string, filePath: string, accessToken: string) {
  const [, , , owner, repo] = repoUrl.split('/');
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Kontexto-IA-Analysis'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const fileData = await response.json();
    
    if (fileData.content) {
      return Buffer.from(fileData.content, 'base64').toString('utf-8');
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error);
    return null;
  }
}

// Function to analyze key project files exhaustively
async function analyzeKeyProjectFiles(repoFiles: any[], repoUrl: string, accessToken: string) {
  const keyFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'README.md',
    'docker-compose.yml',
    'Dockerfile',
    '.env.example',
    'tailwind.config.js',
    'prisma/schema.prisma',
    'src/index.js',
    'src/index.ts',
    'src/main.js',
    'src/main.ts',
    'app/layout.tsx',
    'pages/_app.tsx',
    'nuxt.config.js',
    'vue.config.js',
    'angular.json',
    'pom.xml',
    'build.gradle',
    'go.mod',
    'Cargo.toml',
    'requirements.txt',
    'setup.py',
    'composer.json'
  ];

  const fileContents: { [key: string]: string } = {};
  
  // Find key files in repository
  for (const keyFile of keyFiles) {
    const foundFile = repoFiles.find(f => 
      f.path === keyFile || 
      f.path.endsWith(`/${keyFile}`) || 
      f.path.includes(keyFile)
    );
    
    if (foundFile && foundFile.size < 50000) { // Only get files smaller than 50KB
      const content = await getFileContent(repoUrl, foundFile.path, accessToken);
      if (content) {
        fileContents[foundFile.path] = content.slice(0, 5000); // Limit content to 5KB
      }
    }
  }

  return fileContents;
}

// Function to analyze project structure and generate description
async function analyzeProjectStructure(context: any, commits: any[], repoFiles: any[] = [], keyFileContents: any = {}, accessToken: string) {
  try {
    // Analyze repository structure in detail
    const filePaths = repoFiles.map(f => f.path);
    const totalFiles = repoFiles.length;
    
    // Categorize files by extension and directory
    const filesByExtension = repoFiles.reduce((acc, file) => {
      const ext = file.path.split('.').pop()?.toLowerCase() || 'other';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});

    const dirStructure = repoFiles.reduce((acc, file) => {
      const dir = file.path.split('/')[0] || 'root';
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file.path);
      return acc;
    }, {});

    // Analyze commit patterns
    const commitMessages = commits.map(c => c.message).join('\n');
    const allDiffs = commits.map(c => c.diff || '').join('\n');

    // Identify technology stack from files and content
    const techStack = identifyTechStack(filePaths, keyFileContents);
    
    // Analyze architecture patterns
    const archPatterns = analyzeArchitecture(filePaths, keyFileContents);

    const prompt = `
Realiza un análisis EXHAUSTIVO de este repositorio de código. Eres un arquitecto de software senior con 15+ años de experiencia.

**INFORMACIÓN DEL REPOSITORIO:**
- Nombre: ${context.nombre}
- URL: ${context.repoUrl}
- Rama: ${context.branch || 'main'}
- Descripción inicial: ${context.descripcion}
- Total de archivos: ${totalFiles}

**ESTRUCTURA DETALLADA DEL PROYECTO:**

**Distribución por Tipo de Archivo:**
${Object.entries(filesByExtension)
  .sort(([,a], [,b]) => b - a)
  .map(([ext, count]) => `- .${ext}: ${count} archivos (${((count / totalFiles) * 100).toFixed(1)}%)`).join('\n')}

**Estructura de Directorios:**
${Object.entries(dirStructure)
  .slice(0, 20)
  .map(([dir, files]) => `- ${dir}/: ${files.length} archivos`).join('\n')}

**ARCHIVOS CLAVE ANALIZADOS:**
${Object.entries(keyFileContents).map(([path, content]) => 
  `\n**${path}:**\n\`\`\`\n${content.slice(0, 1500)}\n\`\`\`\n`
).join('\n')}

**STACK TECNOLÓGICO IDENTIFICADO:**
${techStack.join(', ')}

**PATRONES DE ARQUITECTURA:**
${archPatterns.join(', ')}

**HISTORIAL DE COMMITS (últimos 20):**
${commitMessages.slice(0, 3000)}

**CAMBIOS DE CÓDIGO RECIENTES:**
\`\`\`diff
${allDiffs.slice(0, 4000)}
\`\`\`

**ANÁLISIS REQUERIDO - Proporciona un análisis MUY DETALLADO que incluya:**

## 1. **Propósito y Funcionalidad del Proyecto**
- ¿Qué problema resuelve este proyecto?
- ¿Cuáles son las funcionalidades principales?
- ¿Qué tipo de aplicación es? (web, API, microservicio, librería, etc.)

## 2. **Stack Tecnológico Completo**
- Frameworks y librerías principales
- Base de datos y almacenamiento
- Herramientas de build y desarrollo
- Servicios externos integrados
- Versiones específicas cuando sea relevante

## 3. **Arquitectura y Patrones de Diseño**
- Patrón arquitectónico general (MVC, MVP, Hexagonal, Clean, etc.)
- Estructura de carpetas y organización del código
- Separación de responsabilidades
- Patrones de diseño implementados
- Convenciones de nombrado

## 4. **Funcionalidades y Módulos Principales**
- Componentes/módulos principales identificados
- Flujos de datos principales
- APIs y endpoints (si aplica)
- Modelos de datos principales
- Integración con servicios externos

## 5. **Análisis de Calidad del Código**
- Nivel de organización y estructura
- Uso de TypeScript/tipos
- Testing (si hay evidencia)
- Documentación disponible
- Configuraciones de desarrollo

## 6. **Contexto para Desarrollo con IA**
- Convenciones específicas del proyecto que debe seguir una IA
- Ubicación de archivos importantes para modificaciones
- Patrones específicos a mantener
- Dependencias críticas que no se deben romper
- Flujos de trabajo de desarrollo recomendados

## 7. **Próximos Pasos Sugeridos**
- Áreas que podrían necesitar mejora
- Funcionalidades que parecen estar en desarrollo
- Oportunidades de refactorización
- Sugerencias de optimización

Proporciona un análisis MUY DETALLADO, ESPECÍFICO y TÉCNICO. Usa formato Markdown con headers, listas y código cuando sea apropiado.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un arquitecto de software senior con experiencia exhaustiva analizando codebases. Proporciona análisis muy detallados, específicos y técnicos. Usa formato Markdown profesional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.2 // Lower temperature for more focused analysis
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error analyzing project structure:', error);
    return '';
  }
}

// Helper function to identify technology stack
function identifyTechStack(filePaths: string[], keyFileContents: any): string[] {
  const stack = [];
  
  // Frontend frameworks
  if (filePaths.some(f => f.includes('next.config'))) stack.push('Next.js');
  if (filePaths.some(f => f.includes('nuxt.config'))) stack.push('Nuxt.js');
  if (filePaths.some(f => f.includes('vue.config'))) stack.push('Vue.js');
  if (filePaths.some(f => f.includes('angular.json'))) stack.push('Angular');
  
  // Backend frameworks
  if (keyFileContents['package.json']?.includes('express')) stack.push('Express.js');
  if (keyFileContents['package.json']?.includes('fastify')) stack.push('Fastify');
  if (filePaths.some(f => f.includes('go.mod'))) stack.push('Go');
  if (filePaths.some(f => f.includes('Cargo.toml'))) stack.push('Rust');
  if (filePaths.some(f => f.includes('requirements.txt'))) stack.push('Python');
  
  // Databases
  if (filePaths.some(f => f.includes('prisma'))) stack.push('Prisma');
  if (keyFileContents['docker-compose.yml']?.includes('postgres')) stack.push('PostgreSQL');
  if (keyFileContents['docker-compose.yml']?.includes('mongodb')) stack.push('MongoDB');
  
  // CSS frameworks
  if (filePaths.some(f => f.includes('tailwind.config'))) stack.push('Tailwind CSS');
  if (keyFileContents['package.json']?.includes('styled-components')) stack.push('Styled Components');
  
  // Languages
  if (filePaths.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) stack.push('TypeScript');
  if (filePaths.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) stack.push('JavaScript');
  if (filePaths.some(f => f.endsWith('.py'))) stack.push('Python');
  if (filePaths.some(f => f.endsWith('.go'))) stack.push('Go');
  if (filePaths.some(f => f.endsWith('.rs'))) stack.push('Rust');
  if (filePaths.some(f => f.endsWith('.java'))) stack.push('Java');

  return stack;
}

// Helper function to analyze architecture patterns
function analyzeArchitecture(filePaths: string[], keyFileContents: any): string[] {
  const patterns = [];
  
  // Monorepo
  if (filePaths.some(f => f.includes('packages/')) || keyFileContents['package.json']?.includes('workspaces')) {
    patterns.push('Monorepo');
  }
  
  // Microservices
  if (filePaths.some(f => f.includes('services/')) || keyFileContents['docker-compose.yml']) {
    patterns.push('Microservices');
  }
  
  // MVC pattern
  if (filePaths.some(f => f.includes('controllers/')) && 
      filePaths.some(f => f.includes('models/')) && 
      filePaths.some(f => f.includes('views/'))) {
    patterns.push('MVC');
  }
  
  // Clean architecture
  if (filePaths.some(f => f.includes('domain/')) && 
      filePaths.some(f => f.includes('infrastructure/')) && 
      filePaths.some(f => f.includes('application/'))) {
    patterns.push('Clean Architecture');
  }
  
  // API-first
  if (filePaths.some(f => f.includes('api/')) || filePaths.some(f => f.includes('routes/'))) {
    patterns.push('API-First');
  }
  
  // Component-based
  if (filePaths.some(f => f.includes('components/'))) {
    patterns.push('Component-Based');
  }

  return patterns;
}

// Function to analyze commit patterns and generate development context
async function analyzeCommitPatterns(commits: any[], context: any, repoFiles: any[]) {
  try {
    // Analyze commits in much more detail
    const fileChangeAnalysis = {};
    const commitsByType = { feature: [], fix: [], refactor: [], docs: [], other: [] };
    const authorStats = {};
    const frequentFiles = {};
    const codeComplexityPatterns = {};

    commits.forEach(commit => {
      // Categorize commits by type
      const message = commit.message.toLowerCase();
      if (message.includes('feat') || message.includes('add') || message.includes('new')) {
        commitsByType.feature.push(commit);
      } else if (message.includes('fix') || message.includes('bug')) {
        commitsByType.fix.push(commit);
      } else if (message.includes('refactor') || message.includes('improve') || message.includes('clean')) {
        commitsByType.refactor.push(commit);
      } else if (message.includes('doc') || message.includes('readme')) {
        commitsByType.docs.push(commit);
      } else {
        commitsByType.other.push(commit);
      }

      // Track author activity
      const author = commit.author?.name || 'Unknown';
      if (!authorStats[author]) {
        authorStats[author] = { commits: 0, additions: 0, deletions: 0, files: new Set() };
      }
      authorStats[author].commits++;
      authorStats[author].additions += commit.stats?.additions || 0;
      authorStats[author].deletions += commit.stats?.deletions || 0;

      // Track file modification frequency
      if (commit.files) {
        commit.files.forEach(file => {
          if (!frequentFiles[file]) {
            frequentFiles[file] = { count: 0, commits: [], totalChanges: 0 };
          }
          frequentFiles[file].count++;
          frequentFiles[file].commits.push({
            message: commit.message,
            date: commit.date,
            changes: commit.stats?.additions + commit.stats?.deletions || 0
          });
          frequentFiles[file].totalChanges += commit.stats?.additions + commit.stats?.deletions || 0;
          
          authorStats[author].files.add(file);
        });
      }
    });

    // Convert Set to array for serialization
    Object.keys(authorStats).forEach(author => {
      authorStats[author].files = Array.from(authorStats[author].files);
    });

    // Identify patterns in code changes
    const recentDiffs = commits.map(c => c.diff || '').join('\n');
    const codePatterns = analyzeCodePatterns(recentDiffs);

    const prompt = `
Realiza un análisis EXHAUSTIVO de patrones de desarrollo basado en los últimos ${commits.length} commits.

**PROYECTO:** ${context.nombre}
**REPOSITORIO:** ${context.repoUrl}

**ANÁLISIS DETALLADO DE COMMITS:**

**Distribución por Tipo de Commit:**
- Features/Nuevas funcionalidades: ${commitsByType.feature.length} commits
- Bug fixes: ${commitsByType.fix.length} commits  
- Refactoring: ${commitsByType.refactor.length} commits
- Documentación: ${commitsByType.docs.length} commits
- Otros: ${commitsByType.other.length} commits

**ESTADÍSTICAS DE AUTORES:**
${Object.entries(authorStats).map(([author, stats]) => 
  `- **${author}**: ${stats.commits} commits, +${stats.additions}/-${stats.deletions} líneas, ${stats.files.length} archivos únicos`
).join('\n')}

**ARCHIVOS MÁS MODIFICADOS:**
${Object.entries(frequentFiles)
  .sort(([,a], [,b]) => b.count - a.count)
  .slice(0, 15)
  .map(([file, data]) => 
    `- **${file}**: ${data.count} modificaciones, ${data.totalChanges} líneas cambiadas`
  ).join('\n')}

**COMMITS DE FUNCIONALIDADES RECIENTES:**
${commitsByType.feature.slice(0, 10).map(c => 
  `- **${c.message}** (${c.stats?.additions || 0}+ ${c.stats?.deletions || 0}- líneas)`
).join('\n')}

**COMMITS DE CORRECCIONES:**
${commitsByType.fix.slice(0, 10).map(c => 
  `- **${c.message}** (${c.stats?.additions || 0}+ ${c.stats?.deletions || 0}- líneas)`
).join('\n')}

**PATRONES DE CÓDIGO IDENTIFICADOS:**
${codePatterns.join(', ')}

**CAMBIOS DE CÓDIGO DETALLADOS:**
\`\`\`diff
${recentDiffs.slice(0, 5000)}
\`\`\`

**ANÁLISIS REQUERIDO - Proporciona un análisis MUY DETALLADO:**

## 1. **Áreas de Desarrollo Más Activas**
- ¿Qué módulos/componentes se están modificando constantemente?
- ¿Qué tipos de cambios son más frecuentes?
- ¿Hay patrones en las modificaciones?

## 2. **Evolución del Código**
- ¿Cómo ha evolucionado la arquitectura según los commits?
- ¿Qué nuevas funcionalidades se han añadido recientemente?
- ¿Qué problemas se están solucionando frecuentemente?

## 3. **Patrones de Trabajo del Equipo**
- ¿Cómo trabaja el equipo de desarrollo?
- ¿Hay especialización por áreas?
- ¿Cuál es la velocidad de desarrollo?

## 4. **Análisis de Calidad y Mantenimiento**
- ¿Se está refactorizando el código regularmente?
- ¿Hay evidencia de deuda técnica?
- ¿Se está mejorando la estructura del código?

## 5. **Funcionalidades en Desarrollo**
- ¿Qué funcionalidades están siendo desarrolladas actualmente?
- ¿Qué módulos están en construcción?
- ¿Hay evidencia de trabajo en progreso?

## 6. **Contexto Específico para IA Developers**
- ¿Qué convenciones de commit siguen?
- ¿Qué archivos son críticos y requieren cuidado especial?
- ¿Qué patrones específicos debe mantener una IA al desarrollar?
- ¿Qué flujos de trabajo se deben respetar?

## 7. **Recomendaciones para Desarrollo Futuro**
- ¿Qué áreas necesitan más atención?
- ¿Qué oportunidades de mejora existen?
- ¿Qué próximos pasos son lógicos según el patrón de desarrollo?

Sé MUY ESPECÍFICO y TÉCNICO. Incluye ejemplos de código y archivos concretos cuando sea relevante.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: "Eres un senior software architect especializado en análisis de patrones de desarrollo. Proporciona análisis exhaustivos, específicos y técnicos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.2
    });

    return {
      filePatterns: fileChangeAnalysis,
      commitAnalysis: {
        byType: commitsByType,
        authorStats,
        frequentFiles,
        codePatterns
      },
      developmentContext: response.choices[0]?.message?.content || '',
      lastAnalysisAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing commit patterns:', error);
    return {
      filePatterns: {},
      commitAnalysis: {},
      developmentContext: '',
      lastAnalysisAt: new Date()
    };
  }
}

// Helper function to analyze code patterns in diffs
function analyzeCodePatterns(diffs: string): string[] {
  const patterns = [];
  
  if (diffs.includes('import ') || diffs.includes('require(')) patterns.push('Dependency Changes');
  if (diffs.includes('export ') || diffs.includes('module.exports')) patterns.push('Module Exports');
  if (diffs.includes('function ') || diffs.includes('const ') || diffs.includes('=>')) patterns.push('Function Definitions');
  if (diffs.includes('class ') || diffs.includes('interface ')) patterns.push('OOP Structures');
  if (diffs.includes('useState') || diffs.includes('useEffect')) patterns.push('React Hooks');
  if (diffs.includes('async') || diffs.includes('await')) patterns.push('Async Operations');
  if (diffs.includes('test(') || diffs.includes('describe(') || diffs.includes('it(')) patterns.push('Testing Code');
  if (diffs.includes('.env') || diffs.includes('process.env')) patterns.push('Configuration Changes');
  if (diffs.includes('api/') || diffs.includes('endpoint') || diffs.includes('POST') || diffs.includes('GET')) patterns.push('API Development');
  if (diffs.includes('style') || diffs.includes('css') || diffs.includes('className')) patterns.push('UI/Styling Changes');
  if (diffs.includes('database') || diffs.includes('query') || diffs.includes('schema')) patterns.push('Database Operations');
  
  return patterns;
}

// Real LLM Analysis function using OpenAI GPT-4.1-mini
async function analyzeCommitWithLLM(commitInfo: any, context: any) {
  const diffContent = commitInfo.diff || '';
  const filesChanged = commitInfo.files || [];
  const message = commitInfo.message;
  const linesChanged = (commitInfo.stats?.additions || 0) + (commitInfo.stats?.deletions || 0);
  
  // Create a prompt for GPT-4.1-mini to analyze the commit
  const prompt = `
Analyze this Git commit for a code analysis system. Please provide a detailed analysis in JSON format.

**Repository Context:**
- Name: ${context.nombre}
- Description: ${context.descripcion}
- Repository URL: ${context.repoUrl}

**Commit Information:**
- Message: ${message}
- Files Changed: ${filesChanged.length} files (${filesChanged.slice(0, 10).join(', ')}${filesChanged.length > 10 ? '...' : ''})
- Lines Added: ${commitInfo.stats?.additions || 0}
- Lines Deleted: ${commitInfo.stats?.deletions || 0}
- Total Changes: ${linesChanged} lines

**Code Diff (truncated):**
\`\`\`
${diffContent.slice(0, 3000)}${diffContent.length > 3000 ? '\n... (truncated)' : ''}
\`\`\`

Please analyze this commit and respond with a JSON object containing:

1. **summary** (string): A concise summary of what this commit does and its significance
2. **impact** (enum: "low", "medium", "high"): The impact level of this commit on the codebase
3. **complexity** (enum: "simple", "moderate", "complex"): The complexity of the changes made
4. **patterns** (array of strings): Detected patterns like "bug-fix", "feature", "refactoring", "testing", "dependency-update", "security", "performance", "documentation", etc.
5. **suggestions** (array of strings): Specific suggestions for improvement (max 3)
6. **codeQuality** (number 1-10): Overall code quality score based on the changes

Consider:
- Commit message quality and clarity
- Code structure and organization
- Testing coverage
- Security implications
- Performance impacts
- Documentation updates
- Best practices adherence

Respond with ONLY the JSON object, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini as it's more cost-effective and available
      messages: [
        {
          role: "system",
          content: "You are an expert code reviewer and software engineer. Analyze Git commits and provide detailed, actionable feedback in the exact JSON format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: "json_object" }
    });

    const analysisText = response.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response from GPT
    const analysis = JSON.parse(analysisText);
    
    // Validate and ensure all required fields are present
    return {
      summary: analysis.summary || `Commit modifies ${filesChanged.length} files with ${linesChanged} lines changed.`,
      impact: ['low', 'medium', 'high'].includes(analysis.impact) ? analysis.impact : 'medium',
      complexity: ['simple', 'moderate', 'complex'].includes(analysis.complexity) ? analysis.complexity : 'moderate',
      patterns: Array.isArray(analysis.patterns) ? analysis.patterns : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 3) : [],
      codeQuality: (typeof analysis.codeQuality === 'number' && analysis.codeQuality >= 1 && analysis.codeQuality <= 10) 
        ? analysis.codeQuality 
        : 7,
    };

  } catch (error) {
    console.error('Error analyzing commit with OpenAI:', error);
    
    // Fallback to basic analysis if OpenAI fails
    const patterns = [];
    if (diffContent.includes('test') || diffContent.includes('spec')) patterns.push('testing');
    if (diffContent.includes('fix') || message.toLowerCase().includes('fix')) patterns.push('bug-fix');
    if (diffContent.includes('refactor') || message.toLowerCase().includes('refactor')) patterns.push('refactoring');
    if (filesChanged.some((file: string) => file.includes('package.json'))) patterns.push('dependency-update');
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (linesChanged > 100) complexity = 'complex';
    else if (linesChanged > 30) complexity = 'moderate';
    
    let impact: 'low' | 'medium' | 'high' = 'low';
    if (filesChanged.length > 10) impact = 'high';
    else if (filesChanged.length > 3) impact = 'medium';
    
    return {
      summary: `Commit modifies ${filesChanged.length} files with ${linesChanged} lines changed. (AI analysis failed, using fallback)`,
      impact,
      complexity,
      patterns,
      suggestions: ['AI analysis failed - manual review recommended'],
      codeQuality: 6,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (!session.user?.id && !session.user?.githubId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    
    // If no userId in session, get it from database using githubId
    if (!userId && session.user.githubId) {
      const user = await usersRepository.findByGithubId(session.user.githubId);
      if (!user) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
      userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unable to identify user' }, { status: 401 });
    }

    const body = await req.json();
    const { contextId } = body;

    // Basic validation
    if (!contextId) {
      return NextResponse.json({ 
        error: 'contextId es requerido' 
      }, { status: 400 });
    }

    // Verify that the context exists and belongs to the user
    const context = await contextosRepository.findById(contextId);
    if (!context) {
      return NextResponse.json({ 
        error: 'Contexto no encontrado' 
      }, { status: 404 });
    }

    if (context.responsableId !== userId) {
      return NextResponse.json({ 
        error: 'No tienes permisos para analizar este contexto' 
      }, { status: 403 });
    }

    // Start real repository analysis using GitHub API
    console.log(`Starting analysis for context: ${context.nombre} (${context.repoUrl})`);
    
    try {
      // Get access token from session (GitHub OAuth)
      const accessToken = session.accessToken;
      
      if (!accessToken) {
        throw new Error('GitHub access token not found in session');
      }

      console.log('🔍 Step 1: Fetching repository structure and commits...');
      
      // Get repository structure for exhaustive analysis
      const repoFiles = await getRepositoryStructure(context.repoUrl, context.branch || 'main', accessToken);
      console.log(`📁 Found ${repoFiles.length} files in repository`);
      
      // Get key project files content for deep analysis
      console.log('🔑 Step 2: Analyzing key project files...');
      const keyFileContents = await analyzeKeyProjectFiles(repoFiles, context.repoUrl, accessToken);
      console.log(`📄 Analyzed ${Object.keys(keyFileContents).length} key files`);
      
      // Get recent commits from GitHub API
      console.log('📝 Step 3: Fetching and analyzing commits...');
      const recentCommits = await getRecentCommitsFromGitHub(context.repoUrl, accessToken);
      console.log(`💾 Found ${recentCommits.length} recent commits`);
      
      // Generate exhaustive project description if not exists or if it's old
      let projectDescription = context.aiDescription;
      let projectStructure = context.projectStructure;
      
      const needsNewAnalysis = !projectDescription || 
        !context.lastAnalysisAt || 
        (new Date().getTime() - new Date(context.lastAnalysisAt).getTime()) > 24 * 60 * 60 * 1000; // 24 hours

      if (needsNewAnalysis && (recentCommits.length > 0 || repoFiles.length > 0)) {
        console.log('🤖 Step 4: Generating exhaustive project description with AI...');
        projectDescription = await analyzeProjectStructure(context, recentCommits, repoFiles, keyFileContents, accessToken);
        
        // Update context with AI description
        if (projectDescription) {
          await contextosRepository.update(contextId, {
            aiDescription: projectDescription,
            lastAnalysisAt: new Date()
          });
          console.log('✅ Project description updated');
        }
      } else {
        console.log('ℹ️ Using existing project description (recent analysis available)');
      }

      // Analyze commit patterns for exhaustive development context
      console.log('🔄 Step 5: Performing exhaustive commit pattern analysis...');
      const commitAnalysis = await analyzeCommitPatterns(recentCommits, context, repoFiles);
      
      if (commitAnalysis.developmentContext) {
        await contextosRepository.update(contextId, {
          projectStructure: {
            ...commitAnalysis,
            analysisMetrics: {
              totalFiles: repoFiles.length,
              keyFilesAnalyzed: Object.keys(keyFileContents).length,
              commitsAnalyzed: recentCommits.length,
              analysisDate: new Date()
            }
          },
          lastAnalysisAt: new Date()
        });
        console.log('✅ Development context analysis completed');
      }

      // Process each recent commit
      const createdAnalyses = [];
      
      for (const commitInfo of recentCommits) { // Analyze commits from GitHub API
        try {
          // Check if we already analyzed this commit
          const existingCommit = await commitsRepository.findBySha(commitInfo.sha);
          let commitRecord;
          
          if (!existingCommit) {
            // Create commit record
            commitRecord = await commitsRepository.create({
              contextoId: contextId,
              sha: commitInfo.sha,
              message: commitInfo.message,
              author: {
                name: commitInfo.author.name,
                email: commitInfo.author.email,
              },
              date: new Date(commitInfo.date),
              filesChanged: commitInfo.files || [],
              additions: commitInfo.stats?.additions || 0,
              deletions: commitInfo.stats?.deletions || 0,
            } as any);
          } else {
            commitRecord = existingCommit;
          }

          // Check if analysis already exists for this commit
          const existingAnalysis = await analysisRepository.findByCommitId(commitRecord.id);
          
          if (!existingAnalysis) {
            // Get detailed commit info from GitHub API (diff, files, stats)
            const commitDetails = await getCommitDetails(context.repoUrl, commitInfo.sha, accessToken);
            
            // Merge commit info with details
            const fullCommitInfo = {
              ...commitInfo,
              files: commitDetails.files,
              stats: commitDetails.stats,
              diff: commitDetails.diff,
            };
            
            // Create AI analysis using LLM with full commit details
            const analysis = await analyzeCommitWithLLM(fullCommitInfo, context);
            
            // Save analysis to database
            const analysisRecord = await analysisRepository.create({
              commitId: commitRecord.id,
              summary: analysis.summary,
              impact: analysis.impact,
              complexity: analysis.complexity,
              patterns: analysis.patterns,
              suggestions: analysis.suggestions,
              codeQuality: analysis.codeQuality,
            } as any);

            createdAnalyses.push(analysisRecord);
          }
        } catch (error) {
          console.error(`Error analyzing commit ${commitInfo.sha}:`, error);
          // Continue with other commits
        }
      }

      return NextResponse.json({
        message: `Análisis completado exitosamente. Se analizaron ${createdAnalyses.length} commits.`,
        contextId: contextId,
        contextName: context.nombre,
        repoUrl: context.repoUrl,
        status: 'completed',
        analysisCount: createdAnalyses.length,
        commitsProcessed: recentCommits.length,
        metrics: {
          commitsAnalyzed: createdAnalyses.length,
          totalCommitsReviewed: recentCommits.length,
          repository: context.repoUrl.replace('https://github.com/', ''),
        }
      });
    } catch (analysisError) {
      console.error('Repository analysis failed:', analysisError);
      
      return NextResponse.json({
        message: 'Análisis iniciado pero encontró errores. Revisar logs.',
        contextId: contextId,
        contextName: context.nombre,
        repoUrl: context.repoUrl,
        status: 'partial_error',
        error: analysisError instanceof Error ? analysisError.message : 'Unknown error'
      });
    }

  } catch (error: any) {
    console.error('Error starting analysis:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (!session.user?.id && !session.user?.githubId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = session.user.id;
    
    // If no userId in session, get it from database using githubId
    if (!userId && session.user.githubId) {
      const user = await usersRepository.findByGithubId(session.user.githubId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user.id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unable to identify user' }, { status: 401 });
    }
    
    // Get user's contexts first
    const contexts = await contextosRepository.findByResponsable(userId);
    
    if (contexts.length === 0) {
      return NextResponse.json({
        analyses: [],
        total: 0
      });
    }
    
    // Get analyses for all user's contexts
    const allAnalyses = [];
    
    for (const context of contexts) {
      try {
        const contextAnalyses = await analysisRepository.findByContexto(context.id, 10);
        
        // Enrich analyses with context and commit info
        for (const analysis of contextAnalyses) {
          try {
            const commit = await commitsRepository.findById(analysis.commitId);
            if (commit) {
              allAnalyses.push({
                ...analysis,
                context: {
                  id: context.id,
                  name: context.nombre,
                  repoUrl: context.repoUrl
                },
                commit: {
                  id: commit.id,
                  sha: commit.sha,
                  message: commit.message,
                  author: commit.author,
                  date: commit.date,
                  filesChanged: commit.filesChanged,
                  additions: commit.additions,
                  deletions: commit.deletions
                }
              });
            }
          } catch (commitError) {
            console.error(`Error fetching commit for analysis ${analysis.id}:`, commitError);
          }
        }
      } catch (contextError) {
        console.error(`Error fetching analyses for context ${context.id}:`, contextError);
      }
    }
    
    // Sort by creation date (newest first)
    allAnalyses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return NextResponse.json({
      analyses: allAnalyses,
      total: allAnalyses.length
    });

  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}