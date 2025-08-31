import { BaseProcessor } from './base-processor';
import { SimpleRepositoryAnalyzer, GitClient } from '@kontexto/git-analyzer';
import { LLMService } from '../llm/llm-service';
import { contextosRepository, commitsRepository, analysisRepository } from '@kontexto/db';
import { generateId } from '@kontexto/core';
import { logger } from '../utils/logger';

interface CommitAnalysisPayload {
  jobId: string;
  contextoId: string;
  commitSha: string;
  repoUrl: string;
  branch?: string;
}

export class CommitAnalysisProcessor extends BaseProcessor {
  private repositoryAnalyzer: SimpleRepositoryAnalyzer | null = null;
  private llmService: LLMService | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.repositoryAnalyzer = new SimpleRepositoryAnalyzer();
      this.llmService = new LLMService();
      await this.llmService.initialize();

      this.isInitialized = true;
      logger.info('✅ Commit analysis processor initialized');
    } catch (error) {
      logger.error('Failed to initialize commit analysis processor:', error);
      throw error;
    }
  }

  async process(
    payload: CommitAnalysisPayload,
    updateProgress: (progress: number, message?: string) => void
  ): Promise<any> {
    this.validatePayload(payload, ['jobId', 'contextoId', 'commitSha', 'repoUrl']);

    const { contextoId, commitSha, repoUrl, branch = 'main' } = payload;

    updateProgress(5, 'Validating context');

    // Verify context exists
    const contexto = await contextosRepository.findById(contextoId);
    if (!contexto) {
      throw new Error(`Context ${contextoId} not found`);
    }

    updateProgress(10, 'Setting up temporary repository');

    // Create temporary directory for repository
    const tempDir = `/tmp/git-repos/commit-analysis-${Date.now()}`;
    let gitClient: GitClient | null = null;

    try {
      // Clone repository
      gitClient = await GitClient.clone(repoUrl, tempDir, {
        branch,
        depth: 10, // Shallow clone for efficiency
        single: true,
      });

      updateProgress(30, 'Analyzing commit');

      // Get commit information
      const commitInfo = await gitClient.getCommitInfo(commitSha);

      updateProgress(40, 'Storing commit information');

      // Store commit in database if not exists
      let dbCommit = await commitsRepository.findBySha(commitSha);
      if (!dbCommit) {
        dbCommit = await commitsRepository.create({
          contextoId,
          sha: commitSha,
          message: commitInfo.message,
          author: commitInfo.author,
          date: commitInfo.date,
          filesChanged: commitInfo.files,
          additions: commitInfo.stats.additions,
          deletions: commitInfo.stats.deletions,
        });
      }

      updateProgress(50, 'Analyzing code changes');

      // Analyze commit using repository analyzer
      const analysisResult = await this.repositoryAnalyzer!.analyzeCommit(commitSha, gitClient);
      
      if (!analysisResult) {
        throw new Error('Failed to analyze commit');
      }

      updateProgress(70, 'Generating AI analysis');

      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(analysisResult);

      updateProgress(85, 'Storing analysis results');

      // Store analysis in database
      const analysis = await analysisRepository.create({
        commitId: dbCommit.id,
        summary: aiAnalysis.summary,
        impact: aiAnalysis.impact,
        complexity: aiAnalysis.complexity,
        patterns: aiAnalysis.patterns,
        suggestions: aiAnalysis.suggestions,
        codeQuality: aiAnalysis.codeQuality,
      });

      updateProgress(95, 'Finalizing analysis');

      const result = {
        commitId: dbCommit.id,
        analysisId: analysis.id,
        summary: aiAnalysis.summary,
        impact: aiAnalysis.impact,
        complexity: aiAnalysis.complexity,
        filesAnalyzed: analysisResult.changedFiles.length,
        suggestions: aiAnalysis.suggestions,
      };

      updateProgress(100, 'Analysis complete');

      logger.info(`Commit analysis completed for ${commitSha}`);
      return result;

    } finally {
      // Cleanup temporary repository
      if (gitClient) {
        await gitClient.cleanup();
      }
    }
  }

  private async generateAIAnalysis(analysisResult: any): Promise<{
    summary: string;
    impact: 'low' | 'medium' | 'high';
    complexity: 'simple' | 'moderate' | 'complex';
    patterns: string[];
    suggestions: string[];
    codeQuality: number;
  }> {
    if (!this.llmService) {
      throw new Error('LLM service not initialized');
    }

    const prompt = this.buildAnalysisPrompt(analysisResult);
    
    const aiResponse = await this.withRetry(
      () => this.llmService!.analyze(prompt),
      3,
      2000
    );

    // Parse AI response
    return {
      summary: aiResponse.summary || 'No summary available',
      impact: this.determineImpact(analysisResult),
      complexity: this.determineComplexity(analysisResult),
      patterns: aiResponse.patterns || [],
      suggestions: aiResponse.suggestions || analysisResult.suggestions || [],
      codeQuality: this.calculateCodeQuality(analysisResult),
    };
  }

  private buildAnalysisPrompt(analysisResult: any): string {
    const { commit, changedFiles, diffAnalysis, impactAssessment } = analysisResult;

    return `
Analyze the following code commit and provide insights:

**Commit Information:**
- SHA: ${commit.sha}
- Message: ${commit.message}
- Author: ${commit.author.name}
- Files changed: ${commit.files.length}
- Additions: ${commit.stats.additions}
- Deletions: ${commit.stats.deletions}

**Code Changes:**
- Functions added: ${diffAnalysis.addedFunctions.length}
- Functions removed: ${diffAnalysis.removedFunctions.length}
- Functions modified: ${diffAnalysis.modifiedFunctions.length}
- Classes added: ${diffAnalysis.addedClasses.length}
- Classes removed: ${diffAnalysis.removedClasses.length}
- Classes modified: ${diffAnalysis.modifiedClasses.length}
- Complexity change: ${diffAnalysis.complexityChange}
- Risk level: ${diffAnalysis.riskLevel}

**Impact Assessment:**
- Affected modules: ${impactAssessment.affectedModules.join(', ')}
- Breaking changes: ${impactAssessment.breakingChanges.length}
- Performance impact: ${impactAssessment.performanceImpact}

**Files Analyzed:**
${changedFiles.map((file: any, index: number) => `
${index + 1}. Language: ${file.language}
   - Functions: ${file.functions.length}
   - Classes: ${file.classes.length}
   - Lines of code: ${file.linesOfCode}
   - Complexity: ${file.complexity}
`).join('')}

Please provide:
1. A concise summary of the changes (2-3 sentences)
2. Key patterns or architectural decisions identified
3. Specific suggestions for improvement
4. Any potential issues or concerns

Respond in JSON format:
{
  "summary": "string",
  "patterns": ["string"],
  "suggestions": ["string"],
  "concerns": ["string"]
}
    `.trim();
  }

  private determineImpact(analysisResult: any): 'low' | 'medium' | 'high' {
    const { diffAnalysis, impactAssessment } = analysisResult;
    
    // High impact indicators
    if (
      diffAnalysis.riskLevel === 'high' ||
      impactAssessment.breakingChanges.length > 0 ||
      diffAnalysis.removedFunctions.length > 3 ||
      diffAnalysis.removedClasses.length > 0
    ) {
      return 'high';
    }

    // Medium impact indicators
    if (
      diffAnalysis.riskLevel === 'medium' ||
      diffAnalysis.complexityChange > 10 ||
      diffAnalysis.addedFunctions.length > 5 ||
      impactAssessment.affectedModules.length > 3
    ) {
      return 'medium';
    }

    return 'low';
  }

  private determineComplexity(analysisResult: any): 'simple' | 'moderate' | 'complex' {
    const { diffAnalysis, changedFiles } = analysisResult;
    
    const avgComplexity = changedFiles.length > 0 
      ? changedFiles.reduce((sum: number, file: any) => sum + file.complexity, 0) / changedFiles.length
      : 0;

    if (avgComplexity > 15 || diffAnalysis.complexityChange > 20) {
      return 'complex';
    }

    if (avgComplexity > 8 || diffAnalysis.complexityChange > 10) {
      return 'moderate';
    }

    return 'simple';
  }

  private calculateCodeQuality(analysisResult: any): number {
    const { changedFiles, diffAnalysis } = analysisResult;
    
    let score = 70; // Base score

    // Positive factors
    if (diffAnalysis.complexityChange < 0) {
      score += 10; // Complexity reduced
    }

    if (changedFiles.some((file: any) => file.comments.length > 0)) {
      score += 5; // Has comments
    }

    // Negative factors
    if (diffAnalysis.complexityChange > 15) {
      score -= 15;
    }

    if (diffAnalysis.riskLevel === 'high') {
      score -= 10;
    }

    if (analysisResult.impactAssessment.breakingChanges.length > 0) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down commit analysis processor...');

    if (this.llmService) {
      await this.llmService.shutdown();
    }

    this.isInitialized = false;
    logger.info('✅ Commit analysis processor shutdown complete');
  }
}