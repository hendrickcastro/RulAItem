import { 
  jobsRepository, 
  contextosRepository, 
  commitsRepository, 
  analysisRepository 
} from '@kontexto/db';
import { JOB_TYPES, JOB_STATUS } from '@kontexto/core';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Analysis functions (imported from the original analysis route)
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
      files: [],
      stats: {
        additions: 0,
        deletions: 0,
      },
      diff: '',
    }));
  } catch (error) {
    console.error('Error fetching commits from GitHub:', error);
    throw error;
  }
}

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
    
    const files = treeData.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({ path: item.path, sha: item.sha, size: item.size }));

    return files;
  } catch (error) {
    console.error('Error fetching repository structure:', error);
    return [];
  }
}

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

async function analyzeKeyProjectFiles(repoFiles: any[], repoUrl: string, accessToken: string) {
  const keyFiles = [
    'package.json', 'tsconfig.json', 'next.config.js', 'README.md',
    'docker-compose.yml', 'Dockerfile', '.env.example', 'tailwind.config.js',
    'prisma/schema.prisma', 'src/index.js', 'src/index.ts', 'src/main.js',
    'src/main.ts', 'app/layout.tsx', 'pages/_app.tsx', 'nuxt.config.js',
    'vue.config.js', 'angular.json', 'pom.xml', 'build.gradle', 'go.mod',
    'Cargo.toml', 'requirements.txt', 'setup.py', 'composer.json'
  ];

  const fileContents: { [key: string]: string } = {};
  
  for (const keyFile of keyFiles) {
    const foundFile = repoFiles.find(f => 
      f.path === keyFile || 
      f.path.endsWith(`/${keyFile}`) || 
      f.path.includes(keyFile)
    );
    
    if (foundFile && foundFile.size < 50000) {
      const content = await getFileContent(repoUrl, foundFile.path, accessToken);
      if (content) {
        fileContents[foundFile.path] = content.slice(0, 5000);
      }
    }
  }

  return fileContents;
}

async function analyzeProjectStructure(context: any, commits: any[], repoFiles: any[], keyFileContents: any, accessToken: string) {
  try {
    const filePaths = repoFiles.map(f => f.path);
    const totalFiles = repoFiles.length;
    
    const filesByExtension = repoFiles.reduce((acc, file) => {
      const ext = file.path.split('.').pop()?.toLowerCase() || 'other';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});

    const commitMessages = commits.map(c => c.message).join('\n');
    const allDiffs = commits.map(c => c.diff || '').join('\n');

    const techStack = identifyTechStack(filePaths, keyFileContents);
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
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([ext, count]) => `- .${ext}: ${count} archivos (${(((count as number) / totalFiles) * 100).toFixed(1)}%)`).join('\n')}

**ARCHIVOS CLAVE ANALIZADOS:**
${Object.entries(keyFileContents).map(([path, content]) => 
  `\n**${path}:**\n\`\`\`\n${(content as string).slice(0, 1500)}\n\`\`\`\n`
).join('\n')}

**STACK TECNOLÓGICO IDENTIFICADO:**
${techStack.join(', ')}

**PATRONES DE ARQUITECTURA:**
${archPatterns.join(', ')}

**HISTORIAL DE COMMITS (últimos 20):**
${commitMessages.slice(0, 3000)}

**ANÁLISIS REQUERIDO - Proporciona un análisis MUY DETALLADO que incluya:**

## 1. **Propósito y Funcionalidad del Proyecto**
## 2. **Stack Tecnológico Completo**
## 3. **Arquitectura y Patrones de Diseño**
## 4. **Funcionalidades y Módulos Principales**
## 5. **Análisis de Calidad del Código**
## 6. **Contexto para Desarrollo con IA**
## 7. **Próximos Pasos Sugeridos**

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
      temperature: 0.2
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error analyzing project structure:', error);
    return '';
  }
}

function identifyTechStack(filePaths: string[], keyFileContents: any): string[] {
  const stack = [];
  
  if (filePaths.some(f => f.includes('next.config'))) stack.push('Next.js');
  if (filePaths.some(f => f.includes('nuxt.config'))) stack.push('Nuxt.js');
  if (filePaths.some(f => f.includes('vue.config'))) stack.push('Vue.js');
  if (filePaths.some(f => f.includes('angular.json'))) stack.push('Angular');
  
  if (keyFileContents['package.json']?.includes('express')) stack.push('Express.js');
  if (keyFileContents['package.json']?.includes('fastify')) stack.push('Fastify');
  if (filePaths.some(f => f.includes('go.mod'))) stack.push('Go');
  if (filePaths.some(f => f.includes('Cargo.toml'))) stack.push('Rust');
  if (filePaths.some(f => f.includes('requirements.txt'))) stack.push('Python');
  
  if (filePaths.some(f => f.includes('prisma'))) stack.push('Prisma');
  if (keyFileContents['docker-compose.yml']?.includes('postgres')) stack.push('PostgreSQL');
  if (keyFileContents['docker-compose.yml']?.includes('mongodb')) stack.push('MongoDB');
  
  if (filePaths.some(f => f.includes('tailwind.config'))) stack.push('Tailwind CSS');
  if (keyFileContents['package.json']?.includes('styled-components')) stack.push('Styled Components');
  
  if (filePaths.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) stack.push('TypeScript');
  if (filePaths.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) stack.push('JavaScript');
  if (filePaths.some(f => f.endsWith('.py'))) stack.push('Python');
  if (filePaths.some(f => f.endsWith('.go'))) stack.push('Go');
  if (filePaths.some(f => f.endsWith('.rs'))) stack.push('Rust');
  if (filePaths.some(f => f.endsWith('.java'))) stack.push('Java');

  return stack;
}

function analyzeArchitecture(filePaths: string[], keyFileContents: any): string[] {
  const patterns = [];
  
  if (filePaths.some(f => f.includes('packages/')) || keyFileContents['package.json']?.includes('workspaces')) {
    patterns.push('Monorepo');
  }
  
  if (filePaths.some(f => f.includes('services/')) || keyFileContents['docker-compose.yml']) {
    patterns.push('Microservices');
  }
  
  if (filePaths.some(f => f.includes('controllers/')) && 
      filePaths.some(f => f.includes('models/')) && 
      filePaths.some(f => f.includes('views/'))) {
    patterns.push('MVC');
  }
  
  if (filePaths.some(f => f.includes('domain/')) && 
      filePaths.some(f => f.includes('infrastructure/')) && 
      filePaths.some(f => f.includes('application/'))) {
    patterns.push('Clean Architecture');
  }
  
  if (filePaths.some(f => f.includes('api/')) || filePaths.some(f => f.includes('routes/'))) {
    patterns.push('API-First');
  }
  
  if (filePaths.some(f => f.includes('components/'))) {
    patterns.push('Component-Based');
  }

  return patterns;
}

async function analyzeCommitWithLLM(commitInfo: any, context: any) {
  const diffContent = commitInfo.diff || '';
  const filesChanged = commitInfo.files || [];
  const message = commitInfo.message;
  const linesChanged = (commitInfo.stats?.additions || 0) + (commitInfo.stats?.deletions || 0);
  
  const prompt = `
Analyze this Git commit for a code analysis system. Please provide a detailed analysis in JSON format.

**Repository Context:**
- Name: ${context.nombre}
- Description: ${context.descripcion}
- Repository URL: ${context.repoUrl}

**Commit Information:**
- Message: ${message}
- Files Changed: ${filesChanged.length} files
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
4. **patterns** (array of strings): Detected patterns like "bug-fix", "feature", "refactoring", "testing", etc.
5. **suggestions** (array of strings): Specific suggestions for improvement (max 3)
6. **codeQuality** (number 1-10): Overall code quality score based on the changes

Respond with ONLY the JSON object, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysisText = response.choices[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(analysisText);
    
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

// Main worker function to process analysis jobs
export async function processAnalysisJob(jobId: string) {
  console.log(`🔄 Starting to process analysis job: ${jobId}`);
  
  const job = await jobsRepository.findById(jobId);
  if (!job) {
    console.error(`❌ Job ${jobId} not found`);
    return;
  }

  if (job.status !== JOB_STATUS.PENDING) {
    console.log(`⚠️ Job ${jobId} is not pending (status: ${job.status})`);
    return;
  }

  // Mark job as processing
  await jobsRepository.markAsProcessing(jobId);

  try {
    const { contextId, repoUrl, branch, accessToken } = job.payload;
    
    console.log(`🔍 Processing analysis for context: ${contextId}, repo: ${repoUrl}`);

    // Get context details
    const context = await contextosRepository.findById(contextId);
    if (!context) {
      throw new Error('Context not found');
    }

    // Step 1: Get repository structure
    console.log('📁 Step 1: Fetching repository structure...');
    const repoFiles = await getRepositoryStructure(repoUrl, branch || 'main', accessToken);
    console.log(`Found ${repoFiles.length} files in repository`);

    // Step 2: Analyze key files
    console.log('🔑 Step 2: Analyzing key project files...');
    const keyFileContents = await analyzeKeyProjectFiles(repoFiles, repoUrl, accessToken);
    console.log(`Analyzed ${Object.keys(keyFileContents).length} key files`);

    // Step 3: Get recent commits
    console.log('📝 Step 3: Fetching recent commits...');
    const recentCommits = await getRecentCommitsFromGitHub(repoUrl, accessToken);
    console.log(`Found ${recentCommits.length} recent commits`);

    // Step 4: Generate project description
    console.log('🤖 Step 4: Generating AI project description...');
    const projectDescription = await analyzeProjectStructure(context, recentCommits, repoFiles, keyFileContents, accessToken);

    // Update context with AI description
    if (projectDescription) {
      await contextosRepository.update(contextId, {
        aiDescription: projectDescription,
        lastAnalysisAt: new Date()
      });
      console.log('✅ Project description updated');
    }

    // Step 5: Process commits
    console.log('🔄 Step 5: Processing individual commits...');
    const createdAnalyses = [];
    
    for (const commitInfo of recentCommits.slice(0, 10)) { // Process first 10 commits to avoid timeout
      try {
        // Check if we already analyzed this commit
        const existingCommit = await commitsRepository.findBySha(commitInfo.sha);
        let commitRecord;
        
        if (!existingCommit) {
          commitRecord = await commitsRepository.create({
            contextoId: contextId,
            sha: commitInfo.sha,
            message: commitInfo.message,
            author: commitInfo.author,
            date: new Date(commitInfo.date),
            filesChanged: commitInfo.files || [],
            additions: commitInfo.stats?.additions || 0,
            deletions: commitInfo.stats?.deletions || 0,
          } as any);
        } else {
          commitRecord = existingCommit;
        }

        // Check if analysis already exists
        const existingAnalysis = await analysisRepository.findByCommitId(commitRecord.id);
        
        if (!existingAnalysis) {
          // Get detailed commit info
          const commitDetails = await getCommitDetails(repoUrl, commitInfo.sha, accessToken);
          
          const fullCommitInfo = {
            ...commitInfo,
            files: commitDetails.files,
            stats: commitDetails.stats,
            diff: commitDetails.diff,
          };
          
          // Create AI analysis
          const analysis = await analyzeCommitWithLLM(fullCommitInfo, context);
          
          // Save analysis
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
        console.error(`❌ Error analyzing commit ${commitInfo.sha}:`, error);
        // Continue with other commits
      }
    }

    // Mark job as completed
    await jobsRepository.markAsCompleted(jobId, {
      message: `Análisis completado exitosamente. Se analizaron ${createdAnalyses.length} commits.`,
      analysisCount: createdAnalyses.length,
      commitsProcessed: recentCommits.length,
      contextName: context.nombre,
      completedAt: new Date(),
    });

    console.log(`✅ Analysis job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`❌ Analysis job ${jobId} failed:`, error);
    await jobsRepository.markAsFailed(jobId, error instanceof Error ? error.message : 'Unknown error', true);
  }
}

// Worker main loop
export async function startAnalysisWorker() {
  console.log('🚀 Starting analysis worker...');

  const processJobs = async () => {
    try {
      const pendingJobs = await jobsRepository.findPendingJobs(5); // Process up to 5 jobs
      
      if (pendingJobs.length === 0) {
        return;
      }

      console.log(`📋 Found ${pendingJobs.length} pending jobs`);

      // Process jobs in parallel (but limit concurrent jobs)
      const analysisJobs = pendingJobs.filter(job => job.type === JOB_TYPES.ANALYZE_REPO);
      
      for (const job of analysisJobs) {
        // Process job without blocking (fire and forget)
        processAnalysisJob(job.id).catch(error => {
          console.error(`❌ Error processing job ${job.id}:`, error);
        });
      }
    } catch (error) {
      console.error('❌ Error in worker main loop:', error);
    }
  };

  // Run worker every 30 seconds
  setInterval(processJobs, 30000);
  
  // Process immediately on start
  processJobs();
}

// Export for use as a module
if (require.main === module) {
  startAnalysisWorker();
}