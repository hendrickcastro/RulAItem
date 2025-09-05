import { join } from 'path';
import { promises as fs } from 'fs';
import { glob } from 'glob';
import { GitClient } from './git-client';
import { CodeParser } from './code-parser';
import { DiffAnalyzer } from './diff-analyzer';
import { MetricsCalculator } from './metrics-calculator';
import {
  AnalysisResult,
  RepositoryMetrics,
  GitCommitInfo,
  ParsedCode,
  CloneOptions,
} from './types';
import { SUPPORTED_LANGUAGES, FILE_EXTENSIONS } from '@kontexto/core';

export class RepositoryAnalyzer {
  private gitClient: GitClient | null = null;
  private codeParser: CodeParser;
  private diffAnalyzer: DiffAnalyzer;
  private metricsCalculator: MetricsCalculator;

  constructor() {
    this.codeParser = new CodeParser();
    this.diffAnalyzer = new DiffAnalyzer();
    this.metricsCalculator = new MetricsCalculator();
  }

  async analyzeRepository(
    repoUrl: string,
    options: CloneOptions & { tempDir?: string } = {}
  ): Promise<{
    metrics: RepositoryMetrics;
    recentCommits: GitCommitInfo[];
    analysisResults: AnalysisResult[];
  }> {
    const tempDir = options.tempDir || `/tmp/git-repos/${Date.now()}`;
    
    try {
      // Clone repository
      this.gitClient = await GitClient.clone(repoUrl, tempDir, options);
      
      // Analyze repository structure and metrics
      const metrics = await this.calculateRepositoryMetrics();
      
      // Get recent commit history
      const recentCommits = await this.gitClient.getCommitHistory(10);
      
      // Analyze recent commits
      const analysisResults = await Promise.all(
        recentCommits.slice(0, 5).map(commit => this.analyzeCommit(commit.sha))
      );

      return {
        metrics,
        recentCommits,
        analysisResults: analysisResults.filter(Boolean) as AnalysisResult[],
      };
    } finally {
      // Cleanup
      if (this.gitClient) {
        await this.gitClient.cleanup();
        this.gitClient = null;
      }
    }
  }

  async analyzeCommit(sha: string): Promise<AnalysisResult | null> {
    if (!this.gitClient) {
      throw new Error('Repository not initialized');
    }

    try {
      // Get commit information
      const commit = await this.gitClient.getCommitInfo(sha);
      
      // Get diff for the commit
      const diffString = await this.gitClient.getDiff(sha);
      const diffFiles = this.diffAnalyzer.parseDiff(diffString);
      
      // Analyze each changed file
      const changedFiles: ParsedCode[] = [];
      const diffAnalyses: any[] = [];
      
      for (const file of commit.files) {
        if (!this.isAnalyzableFile(file)) {
          continue;
        }

        try {
          // Get current file content
          const currentContent = await this.gitClient.getFileContent(file);
          const currentParsed = this.codeParser.parseCode(currentContent, file);
          
          if (currentParsed) {
            changedFiles.push(currentParsed);
          }

          // Get previous file content for comparison
          let previousParsed: ParsedCode | null = null;
          try {
            const previousContent = await this.gitClient.getFileContent(file, `${sha}^`);
            previousParsed = this.codeParser.parseCode(previousContent, file);
          } catch (error) {
            // File might be new, ignore error
          }

          // Analyze diff
          const diffAnalysis = this.diffAnalyzer.analyzeDiff(previousParsed, currentParsed);
          diffAnalyses.push(diffAnalysis);
          
        } catch (error: any) {
          console.warn(`Failed to analyze file ${file}:`, error.message);
        }
      }

      // Aggregate diff analysis
      const aggregatedDiff = this.aggregateDiffAnalyses(diffAnalyses);
      
      // Generate impact assessment
      const impactAssessment = this.generateImpactAssessment(commit, changedFiles, aggregatedDiff);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(commit, aggregatedDiff, impactAssessment);

      return {
        commit,
        changedFiles,
        diffAnalysis: aggregatedDiff,
        impactAssessment,
        suggestions,
      };
    } catch (error: any) {
      console.error(`Failed to analyze commit ${sha}:`, error.message);
      return null;
    }
  }

  private async calculateRepositoryMetrics(): Promise<RepositoryMetrics> {
    if (!this.gitClient) {
      throw new Error('Repository not initialized');
    }

    const repoPath = this.gitClient.getRepoPath();
    
    // Find all source files
    const allFiles = await this.findSourceFiles(repoPath);
    
    let totalLinesOfCode = 0;
    let complexityScore = 0;
    const languageBreakdown: Record<string, number> = {};
    
    // Analyze each file
    for (const filePath of allFiles) {
      const relativePath = filePath.replace(repoPath + '/', '');
      const parsed = await this.codeParser.parseFile(filePath);
      
      if (parsed) {
        totalLinesOfCode += parsed.linesOfCode;
        complexityScore += parsed.complexity;
        
        languageBreakdown[parsed.language] = (languageBreakdown[parsed.language] || 0) + 1;
      }
    }

    // Calculate dependencies
    const dependencies = await this.extractDependencies(repoPath);

    return {
      totalFiles: allFiles.length,
      totalLinesOfCode,
      languageBreakdown,
      complexityScore: Math.round(complexityScore / Math.max(allFiles.length, 1)),
      dependencies,
    };
  }

  private async findSourceFiles(repoPath: string): Promise<string[]> {
    const patterns: string[] = [];
    
    // Add patterns for all supported languages
    for (const [language, extensions] of Object.entries(FILE_EXTENSIONS)) {
      for (const ext of extensions as unknown as string[]) {
        patterns.push(`**/*${ext}`);
      }
    }

    const files: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const matches = await glob(pattern, {
          cwd: repoPath,
          absolute: true,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/target/**',
            '**/vendor/**',
            '**/__pycache__/**',
            '**/venv/**',
            '**/.venv/**',
          ],
        });
        files.push(...matches);
      } catch (error) {
        console.warn(`Failed to glob pattern ${pattern}:`, error);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  private async extractDependencies(repoPath: string): Promise<any[]> {
    const dependencies: any[] = [];

    try {
      // Check for package.json
      const packageJsonPath = join(repoPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        if (packageJson.dependencies) {
          for (const [name, version] of Object.entries(packageJson.dependencies)) {
            dependencies.push({
              name,
              version: version as string,
              type: 'direct',
              source: 'package.json',
            });
          }
        }

        if (packageJson.devDependencies) {
          for (const [name, version] of Object.entries(packageJson.devDependencies)) {
            dependencies.push({
              name,
              version: version as string,
              type: 'dev',
              source: 'package.json',
            });
          }
        }
      } catch (error) {
        // package.json doesn't exist or is invalid
      }

      // Check for requirements.txt
      const requirementsPath = join(repoPath, 'requirements.txt');
      try {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        
        requirements.split('\n').forEach(line => {
          line = line.trim();
          if (line && !line.startsWith('#')) {
            const match = line.match(/^([^=><]+)[=><].*/);
            if (match) {
              dependencies.push({
                name: match[1].trim(),
                version: line.replace(match[1], '').trim(),
                type: 'direct',
                source: 'requirements.txt',
              });
            }
          }
        });
      } catch (error) {
        // requirements.txt doesn't exist
      }

      // Add more dependency file parsers as needed (pom.xml, go.mod, etc.)

    } catch (error: any) {
      console.warn('Failed to extract dependencies:', error.message);
    }

    return dependencies;
  }

  private isAnalyzableFile(filePath: string): boolean {
    const supportedExtensions = Object.values(FILE_EXTENSIONS).flat() as string[];
    return supportedExtensions.some(ext => filePath.endsWith(ext as string));
  }

  private aggregateDiffAnalyses(analyses: any[]): any {
    return {
      addedFunctions: analyses.flatMap(a => a.addedFunctions || []),
      removedFunctions: analyses.flatMap(a => a.removedFunctions || []),
      modifiedFunctions: analyses.flatMap(a => a.modifiedFunctions || []),
      addedClasses: analyses.flatMap(a => a.addedClasses || []),
      removedClasses: analyses.flatMap(a => a.removedClasses || []),
      modifiedClasses: analyses.flatMap(a => a.modifiedClasses || []),
      complexityChange: analyses.reduce((sum, a) => sum + (a.complexityChange || 0), 0),
      riskLevel: this.calculateOverallRisk(analyses),
    };
  }

  private calculateOverallRisk(analyses: any[]): 'low' | 'medium' | 'high' {
    const highRiskCount = analyses.filter(a => a.riskLevel === 'high').length;
    const mediumRiskCount = analyses.filter(a => a.riskLevel === 'medium').length;

    if (highRiskCount > 0 || analyses.length > 5) {
      return 'high';
    } else if (mediumRiskCount > 1 || analyses.length > 2) {
      return 'medium';
    }

    return 'low';
  }

  private generateImpactAssessment(commit: GitCommitInfo, files: ParsedCode[], diff: any): any {
    return {
      affectedModules: [...new Set(files.map(f => f.language))],
      breakingChanges: this.detectBreakingChanges(diff),
      testImpact: this.assessTestImpact(commit.files),
      performanceImpact: this.assessPerformanceImpact(diff),
      securityImpact: this.assessSecurityImpact(diff, files),
    };
  }

  private detectBreakingChanges(diff: any): any[] {
    const breakingChanges: any[] = [];

    // Detect removed public functions/classes
    diff.removedFunctions?.forEach((func: any) => {
      if (!func.name.startsWith('_')) { // Assume non-underscore functions are public
        breakingChanges.push({
          type: 'removal',
          description: `Removed public function: ${func.name}`,
          file: 'unknown',
          line: func.startLine,
          severity: 'high',
        });
      }
    });

    diff.removedClasses?.forEach((cls: any) => {
      breakingChanges.push({
        type: 'removal',
        description: `Removed class: ${cls.name}`,
        file: 'unknown',
        line: cls.startLine,
        severity: 'high',
      });
    });

    return breakingChanges;
  }

  private assessTestImpact(files: string[]): any {
    const testFiles = files.filter(f => 
      f.includes('test') || f.includes('spec') || f.includes('__tests__')
    );

    return {
      testsAffected: testFiles,
      newTestsNeeded: files.filter(f => !testFiles.includes(f)),
      coverageChange: 0, // Would need more sophisticated analysis
    };
  }

  private assessPerformanceImpact(diff: any): 'positive' | 'negative' | 'neutral' {
    const complexityChange = diff.complexityChange || 0;
    
    if (complexityChange > 10) {
      return 'negative';
    } else if (complexityChange < -5) {
      return 'positive';
    }

    return 'neutral';
  }

  private assessSecurityImpact(diff: any, files: ParsedCode[]): any {
    const vulnerabilities: any[] = [];

    // Simple security pattern detection
    files.forEach(file => {
      file.functions.forEach(func => {
        if (func.name.toLowerCase().includes('password') || 
            func.name.toLowerCase().includes('secret') ||
            func.name.toLowerCase().includes('key')) {
          vulnerabilities.push({
            type: 'sensitive_function',
            description: `Function ${func.name} may handle sensitive data`,
            severity: 'medium',
            file: 'unknown',
            line: func.startLine,
            recommendation: 'Ensure proper encryption and access controls',
          });
        }
      });
    });

    return {
      vulnerabilities,
      riskLevel: vulnerabilities.length > 0 ? 'medium' : 'low',
    };
  }

  private generateSuggestions(commit: GitCommitInfo, diff: any, impact: any): string[] {
    const suggestions: string[] = [];

    if (diff.complexityChange > 20) {
      suggestions.push('Consider refactoring to reduce complexity');
    }

    if (diff.addedFunctions.length > 10) {
      suggestions.push('Large number of functions added - ensure adequate testing');
    }

    if (impact.breakingChanges.length > 0) {
      suggestions.push('Breaking changes detected - update documentation and version');
    }

    if (diff.riskLevel === 'high') {
      suggestions.push('High-risk changes detected - consider additional code review');
    }

    if (commit.files.length > 20) {
      suggestions.push('Large commit affecting many files - consider splitting into smaller commits');
    }

    return suggestions;
  }
}