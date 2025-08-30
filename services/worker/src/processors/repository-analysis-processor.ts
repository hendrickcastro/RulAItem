import { BaseProcessor } from './base-processor';
import { contextosRepository, commitsRepository, analysisRepository } from '@kontexto/db';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class RepositoryAnalysisProcessor extends BaseProcessor {
  async initialize(): Promise<void> {
    this.isInitialized = true;
    logger.info('✅ Repository analysis processor initialized');
  }

  async process(payload: any, updateProgress: (progress: number, message?: string) => void): Promise<any> {
    const { contextId, repoUrl, branch, accessToken, contextName } = payload;
    
    updateProgress(0, 'Iniciando análisis del repositorio');
    logger.info(`🔍 Starting repository analysis for: ${contextName} (${repoUrl})`);

    try {
      // Get context details
      const context = await contextosRepository.findById(contextId);
      if (!context) {
        throw new Error('Context not found');
      }

      updateProgress(10, 'Obteniendo estructura del repositorio');
      
      // Step 1: Get repository structure
      const repoFiles = await this.getRepositoryStructure(repoUrl, branch || 'main', accessToken);
      logger.info(`📁 Found ${repoFiles.length} files in repository`);
      
      updateProgress(25, 'Analizando archivos clave del proyecto');
      
      // Step 2: Analyze key files
      const keyFileContents = await this.analyzeKeyProjectFiles(repoFiles, repoUrl, accessToken);
      logger.info(`🔑 Analyzed ${Object.keys(keyFileContents).length} key files`);

      updateProgress(40, 'Obteniendo commits recientes');
      
      // Step 3: Get recent commits
      const recentCommits = await this.getRecentCommitsFromGitHub(repoUrl, accessToken);
      logger.info(`📝 Found ${recentCommits.length} recent commits`);

      updateProgress(60, 'Generando descripción del proyecto con IA');
      
      // Step 4: Generate project description
      const projectDescription = await this.analyzeProjectStructure(context, recentCommits, repoFiles, keyFileContents);

      // Update context with AI description
      if (projectDescription) {
        await contextosRepository.update(contextId, {
          aiDescription: projectDescription,
          lastAnalysisAt: new Date()
        });
        logger.info('✅ Project description updated');
      }

      updateProgress(75, 'Analizando commits individuales');
      
      // Step 5: Process commits
      const createdAnalyses = [];
      const commitsToProcess = recentCommits.slice(0, 10); // Process first 10 commits
      
      for (let i = 0; i < commitsToProcess.length; i++) {
        const commitInfo = commitsToProcess[i];
        const progress = 75 + (i / commitsToProcess.length) * 20; // 75% to 95%
        updateProgress(progress, `Analizando commit ${i + 1}/${commitsToProcess.length}: ${commitInfo.message.slice(0, 50)}...`);
        
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
            const commitDetails = await this.getCommitDetails(repoUrl, commitInfo.sha, accessToken);
            
            const fullCommitInfo = {
              ...commitInfo,
              files: commitDetails.files,
              stats: commitDetails.stats,
              diff: commitDetails.diff,
            };
            
            // Create AI analysis
            const analysis = await this.analyzeCommitWithLLM(fullCommitInfo, context);
            
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
          logger.error(`❌ Error analyzing commit ${commitInfo.sha}:`, error);
          // Continue with other commits
        }
      }

      updateProgress(100, 'Análisis completado exitosamente');
      
      const result = {
        status: 'completed',
        type: 'repository_analysis',
        message: `Análisis completado exitosamente. Se analizaron ${createdAnalyses.length} commits.`,
        analysisCount: createdAnalyses.length,
        commitsProcessed: recentCommits.length,
        contextName: context.nombre,
        completedAt: new Date(),
      };

      logger.info(`✅ Repository analysis completed for ${contextName}: ${createdAnalyses.length} commits analyzed`);
      return result;

    } catch (error) {
      logger.error(`❌ Repository analysis failed for ${contextName}:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    this.isInitialized = false;
    logger.info('✅ Repository analysis processor shutdown');
  }

  // GitHub API methods
  private async getRecentCommitsFromGitHub(repoUrl: string, accessToken: string) {
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
        stats: { additions: 0, deletions: 0 },
        diff: '',
      }));
    } catch (error) {
      logger.error('Error fetching commits from GitHub:', error);
      throw error;
    }
  }

  private async getCommitDetails(repoUrl: string, sha: string, accessToken: string) {
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
      logger.error(`Error fetching commit details for ${sha}:`, error);
      return {
        files: [],
        stats: { additions: 0, deletions: 0 },
        diff: '',
      };
    }
  }

  private async getRepositoryStructure(repoUrl: string, branch: string, accessToken: string) {
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
      logger.error('Error fetching repository structure:', error);
      return [];
    }
  }

  private async getFileContent(repoUrl: string, filePath: string, accessToken: string) {
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
      logger.error(`Error fetching file content for ${filePath}:`, error);
      return null;
    }
  }

  private async analyzeKeyProjectFiles(repoFiles: any[], repoUrl: string, accessToken: string) {
    const keyFiles = [
      'package.json', 'tsconfig.json', 'next.config.js', 'README.md',
      'docker-compose.yml', 'Dockerfile', '.env.example', 'tailwind.config.js',
      'prisma/schema.prisma', 'src/index.js', 'src/index.ts', 'src/main.js',
      'src/main.ts', 'app/layout.tsx', 'pages/_app.tsx'
    ];

    const fileContents: { [key: string]: string } = {};
    
    for (const keyFile of keyFiles) {
      const foundFile = repoFiles.find(f => 
        f.path === keyFile || 
        f.path.endsWith(`/${keyFile}`) || 
        f.path.includes(keyFile)
      );
      
      if (foundFile && foundFile.size < 50000) {
        const content = await this.getFileContent(repoUrl, foundFile.path, accessToken);
        if (content) {
          fileContents[foundFile.path] = content.slice(0, 5000);
        }
      }
    }

    return fileContents;
  }

  private async analyzeProjectStructure(context: any, commits: any[], repoFiles: any[], keyFileContents: any) {
    try {
      const filePaths = repoFiles.map(f => f.path);
      const totalFiles = repoFiles.length;
      
      const filesByExtension = repoFiles.reduce((acc, file) => {
        const ext = file.path.split('.').pop()?.toLowerCase() || 'other';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
      }, {});

      const commitMessages = commits.map(c => c.message).join('\n');
      const techStack = this.identifyTechStack(filePaths, keyFileContents);
      const archPatterns = this.analyzeArchitecture(filePaths, keyFileContents);

      const prompt = `
Realiza un análisis EXHAUSTIVO de este repositorio de código.

**INFORMACIÓN DEL REPOSITORIO:**
- Nombre: ${context.nombre}
- URL: ${context.repoUrl}
- Rama: ${context.branch || 'main'}
- Total de archivos: ${totalFiles}

**DISTRIBUCIÓN POR TIPO DE ARCHIVO:**
${Object.entries(filesByExtension)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([ext, count]) => `- .${ext}: ${count} archivos`).join('\n')}

**STACK TECNOLÓGICO:** ${techStack.join(', ')}
**PATRONES DE ARQUITECTURA:** ${archPatterns.join(', ')}

**COMMITS RECIENTES:**
${commitMessages.slice(0, 2000)}

Proporciona un análisis detallado del propósito, tecnologías, arquitectura y funcionalidades principales del proyecto. Formato Markdown.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un arquitecto de software senior. Analiza proyectos de código y proporciona descripciones técnicas detalladas en formato Markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.2
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Error analyzing project structure:', error);
      return '';
    }
  }

  private identifyTechStack(filePaths: string[], keyFileContents: any): string[] {
    const stack = [];
    
    if (filePaths.some(f => f.includes('next.config'))) stack.push('Next.js');
    if (filePaths.some(f => f.includes('nuxt.config'))) stack.push('Nuxt.js');
    if (filePaths.some(f => f.includes('vue.config'))) stack.push('Vue.js');
    if (filePaths.some(f => f.includes('angular.json'))) stack.push('Angular');
    
    if (keyFileContents['package.json']?.includes('express')) stack.push('Express.js');
    if (filePaths.some(f => f.includes('go.mod'))) stack.push('Go');
    if (filePaths.some(f => f.includes('requirements.txt'))) stack.push('Python');
    
    if (filePaths.some(f => f.includes('prisma'))) stack.push('Prisma');
    if (filePaths.some(f => f.includes('tailwind.config'))) stack.push('Tailwind CSS');
    
    if (filePaths.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) stack.push('TypeScript');
    if (filePaths.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) stack.push('JavaScript');

    return stack;
  }

  private analyzeArchitecture(filePaths: string[], keyFileContents: any): string[] {
    const patterns = [];
    
    if (filePaths.some(f => f.includes('packages/')) || keyFileContents['package.json']?.includes('workspaces')) {
      patterns.push('Monorepo');
    }
    
    if (filePaths.some(f => f.includes('services/')) || keyFileContents['docker-compose.yml']) {
      patterns.push('Microservices');
    }
    
    if (filePaths.some(f => f.includes('api/')) || filePaths.some(f => f.includes('routes/'))) {
      patterns.push('API-First');
    }
    
    if (filePaths.some(f => f.includes('components/'))) {
      patterns.push('Component-Based');
    }

    return patterns;
  }

  private async analyzeCommitWithLLM(commitInfo: any, context: any) {
    const diffContent = commitInfo.diff || '';
    const filesChanged = commitInfo.files || [];
    const message = commitInfo.message;
    const linesChanged = (commitInfo.stats?.additions || 0) + (commitInfo.stats?.deletions || 0);
    
    const prompt = `
Analyze this Git commit and respond with a JSON object:

**Commit:** ${message}
**Files:** ${filesChanged.length} files changed
**Lines:** +${commitInfo.stats?.additions || 0}/-${commitInfo.stats?.deletions || 0}

**Diff:**
\`\`\`
${diffContent.slice(0, 2000)}
\`\`\`

Respond with JSON containing:
- summary: brief description
- impact: "low", "medium", or "high"
- complexity: "simple", "moderate", or "complex"  
- patterns: array of patterns like ["feature", "bug-fix", "refactoring"]
- suggestions: array of improvement suggestions (max 3)
- codeQuality: number 1-10`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a code reviewer. Analyze commits and respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
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
      logger.error('Error analyzing commit with OpenAI:', error);
      
      // Fallback analysis
      const patterns = [];
      if (diffContent.includes('test') || diffContent.includes('spec')) patterns.push('testing');
      if (diffContent.includes('fix') || message.toLowerCase().includes('fix')) patterns.push('bug-fix');
      if (message.toLowerCase().includes('feat') || message.toLowerCase().includes('add')) patterns.push('feature');
      
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
      if (linesChanged > 100) complexity = 'complex';
      else if (linesChanged > 30) complexity = 'moderate';
      
      let impact: 'low' | 'medium' | 'high' = 'low';
      if (filesChanged.length > 10) impact = 'high';
      else if (filesChanged.length > 3) impact = 'medium';
      
      return {
        summary: `Commit modifies ${filesChanged.length} files with ${linesChanged} lines changed. (AI analysis failed)`,
        impact,
        complexity,
        patterns,
        suggestions: ['Manual review recommended due to AI analysis failure'],
        codeQuality: 6,
      };
    }
  }
}