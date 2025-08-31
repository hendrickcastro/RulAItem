import { GitClient } from './git-client';
import { RobustCodeParser } from './robust-code-parser';
import { DiffAnalyzer } from './diff-analyzer';
import { MetricsCalculator } from './metrics-calculator';
import { 
  AnalysisResult, 
  ParsedCode, 
  DiffAnalysis, 
  ImpactAssessment, 
  GitCommitInfo 
} from './types';

/**
 * Robust repository analyzer that gracefully handles different parsing capabilities
 * Automatically adapts to available parsing methods (Tree-sitter or regex fallback)
 */
export class RobustRepositoryAnalyzer {
  private codeParser: RobustCodeParser;
  private diffAnalyzer: DiffAnalyzer;
  private metricsCalculator: MetricsCalculator;

  constructor() {
    this.codeParser = new RobustCodeParser();
    this.diffAnalyzer = new DiffAnalyzer();
    this.metricsCalculator = new MetricsCalculator();
  }

  /**
   * Analyze a single commit with robust error handling
   */
  async analyzeCommit(commitSha: string, gitClient?: GitClient): Promise<AnalysisResult> {
    if (!gitClient) {
      throw new Error('GitClient instance is required for commit analysis');
    }

    try {
      // Get commit information
      const commit = await gitClient.getCommitInfo(commitSha);
      
      console.log(`🔍 Analyzing commit ${commitSha} (${commit.files.length} files changed)`);

      // Parse changed files
      const changedFiles = await this.parseChangedFiles(commit, gitClient);
      
      // Analyze diff patterns
      const diffAnalysis = this.analyzeDiffPatterns(changedFiles, commit);
      
      // Assess impact
      const impactAssessment = this.assessImpact(changedFiles, commit, diffAnalysis);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(changedFiles, diffAnalysis, impactAssessment);

      console.log(`✅ Analysis complete: ${changedFiles.length} files parsed, complexity: ${diffAnalysis.complexityChange}`);

      return {
        commit,
        changedFiles,
        diffAnalysis,
        impactAssessment,
        suggestions,
      };
    } catch (error) {
      console.error(`❌ Error analyzing commit ${commitSha}:`, error);
      throw error;
    }
  }

  /**
   * Parse all changed files in a commit
   */
  private async parseChangedFiles(commit: GitCommitInfo, gitClient: GitClient): Promise<ParsedCode[]> {
    const parsedFiles: ParsedCode[] = [];
    const parsePromises: Promise<void>[] = [];

    for (const filePath of commit.files) {
      const parsePromise = this.parseFile(filePath, gitClient, commit.sha)
        .then(parsedFile => {
          if (parsedFile) {
            parsedFiles.push(parsedFile);
          }
        })
        .catch(error => {
          console.warn(`⚠️ Failed to parse file ${filePath}:`, error instanceof Error ? error.message : String(error));
          // Create minimal parsed file entry
          parsedFiles.push(this.createMinimalParsedFile(filePath));
        });

      parsePromises.push(parsePromise);
    }

    await Promise.all(parsePromises);
    return parsedFiles;
  }

  /**
   * Parse a single file with error handling
   */
  private async parseFile(filePath: string, gitClient: GitClient, commitSha: string): Promise<ParsedCode | null> {
    try {
      // Get file content
      const content = await gitClient.getFileContent(filePath, commitSha);
      if (!content) return null;

      // Determine language
      const language = this.detectLanguage(filePath);
      if (!language) return null;

      // Parse with robust parser
      return await this.codeParser.parseCode(content, language, filePath);
    } catch (error) {
      console.warn(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return this.createMinimalParsedFile(filePath);
    }
  }

  /**
   * Create minimal parsed file for cases where parsing fails
   */
  private createMinimalParsedFile(filePath: string): ParsedCode {
    return {
      language: this.detectLanguage(filePath) || 'unknown',
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      comments: [],
      complexity: 1,
      linesOfCode: 0,
    };
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string | null {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
    };

    return languageMap[extension || ''] || null;
  }

  /**
   * Analyze diff patterns between code versions
   */
  private analyzeDiffPatterns(changedFiles: ParsedCode[], commit: GitCommitInfo): DiffAnalysis {
    // Calculate aggregate metrics
    const totalFunctions = changedFiles.reduce((sum, file) => sum + file.functions.length, 0);
    const totalClasses = changedFiles.reduce((sum, file) => sum + file.classes.length, 0);
    const avgComplexity = changedFiles.length > 0 
      ? changedFiles.reduce((sum, file) => sum + file.complexity, 0) / changedFiles.length
      : 0;

    // Determine risk level based on various factors
    const riskLevel = this.calculateRiskLevel(changedFiles, commit);

    // Estimate complexity change (simplified - would need before/after comparison)
    const complexityChange = Math.floor(avgComplexity - 5); // Baseline complexity

    return {
      addedFunctions: [], // Simplified - would need detailed diff analysis
      removedFunctions: [],
      modifiedFunctions: [],
      addedClasses: [],
      removedClasses: [],
      modifiedClasses: [],
      complexityChange,
      riskLevel,
    };
  }

  /**
   * Calculate risk level based on change patterns
   */
  private calculateRiskLevel(changedFiles: ParsedCode[], commit: GitCommitInfo): 'low' | 'medium' | 'high' {
    const filesChanged = commit.files.length;
    const linesChanged = commit.stats.additions + commit.stats.deletions;
    const avgComplexity = changedFiles.length > 0 
      ? changedFiles.reduce((sum, file) => sum + file.complexity, 0) / changedFiles.length
      : 0;

    // High risk indicators
    if (filesChanged > 10 || linesChanged > 500 || avgComplexity > 15) {
      return 'high';
    }

    // Medium risk indicators  
    if (filesChanged > 5 || linesChanged > 100 || avgComplexity > 10) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess the impact of changes
   */
  private assessImpact(changedFiles: ParsedCode[], commit: GitCommitInfo, diffAnalysis: DiffAnalysis): ImpactAssessment {
    // Identify affected modules/directories
    const affectedModules = this.identifyAffectedModules(commit.files);
    
    // Detect potential breaking changes (simplified)
    const breakingChanges = this.detectBreakingChanges(changedFiles, commit);
    
    // Assess test impact
    const testImpact = this.assessTestImpact(commit.files);
    
    // Assess performance impact (simplified)
    const performanceImpact = diffAnalysis.riskLevel === 'high' ? 'negative' : 'neutral';
    
    // Assess security impact (simplified)
    const securityImpact = this.assessSecurityImpact(changedFiles, commit);

    return {
      affectedModules,
      breakingChanges,
      testImpact,
      performanceImpact: performanceImpact as 'positive' | 'negative' | 'neutral',
      securityImpact,
    };
  }

  /**
   * Identify affected modules from file paths
   */
  private identifyAffectedModules(files: string[]): string[] {
    const modules = new Set<string>();
    
    files.forEach(file => {
      const parts = file.split('/');
      if (parts.length > 1) {
        modules.add(parts[0]);
      }
    });

    return Array.from(modules);
  }

  /**
   * Detect potential breaking changes (simplified analysis)
   */
  private detectBreakingChanges(changedFiles: ParsedCode[], commit: GitCommitInfo): any[] {
    const breakingChanges: any[] = [];
    
    // Look for deleted public functions/classes
    changedFiles.forEach(file => {
      file.functions.forEach(func => {
        if (func.name.startsWith('public') || !func.name.startsWith('_')) {
          // Potential breaking change if this is a deletion
          // Would need actual diff analysis to determine
        }
      });
    });

    return breakingChanges;
  }

  /**
   * Assess test impact
   */
  private assessTestImpact(files: string[]): any {
    const testFiles = files.filter(file => 
      file.includes('test') || 
      file.includes('spec') || 
      file.endsWith('.test.js') || 
      file.endsWith('.spec.js')
    );

    return {
      testsAffected: testFiles,
      coverageChange: 0, // Would need coverage analysis
      newTestsNeeded: files.filter(file => !testFiles.includes(file)),
    };
  }

  /**
   * Assess security impact (simplified)
   */
  private assessSecurityImpact(changedFiles: ParsedCode[], commit: GitCommitInfo): any {
    const securityKeywords = ['password', 'token', 'key', 'secret', 'auth', 'crypto'];
    const concerns: string[] = [];
    
    // Check commit message for security-related terms
    const message = commit.message.toLowerCase();
    securityKeywords.forEach(keyword => {
      if (message.includes(keyword)) {
        concerns.push(`Security-related change detected: ${keyword}`);
      }
    });

    return {
      vulnerabilities: [], // Would be populated with actual vulnerability analysis
      riskLevel: concerns.length > 0 ? 'medium' : 'low',
    };
  }

  /**
   * Generate suggestions based on analysis
   */
  private generateSuggestions(
    changedFiles: ParsedCode[], 
    diffAnalysis: DiffAnalysis, 
    impactAssessment: ImpactAssessment
  ): string[] {
    const suggestions: string[] = [];

    // Risk-based suggestions
    if (diffAnalysis.riskLevel === 'high') {
      suggestions.push('Consider breaking this large change into smaller, focused commits');
      suggestions.push('Ensure comprehensive testing for high-risk changes');
    }

    // Complexity-based suggestions
    if (diffAnalysis.complexityChange > 10) {
      suggestions.push('Consider refactoring to reduce code complexity');
      suggestions.push('Add inline comments for complex logic');
    }

    // Test-related suggestions
    if (impactAssessment.testImpact.newTestsNeeded.length > 0) {
      suggestions.push('Consider adding tests for the modified functionality');
    }

    // Security suggestions
    if (impactAssessment.securityImpact.riskLevel !== 'low') {
      suggestions.push('Review security implications of the changes');
    }

    // Module impact suggestions
    if (impactAssessment.affectedModules.length > 3) {
      suggestions.push('Consider the cross-module impact of these changes');
    }

    // Default suggestion if no specific ones apply
    if (suggestions.length === 0) {
      suggestions.push('Code changes look good - consider reviewing for optimization opportunities');
    }

    return suggestions;
  }

  /**
   * Get parser capabilities info
   */
  getCapabilities(): {
    treeSitterAvailable: boolean;
    supportedLanguages: string[];
    parsingMethod: string;
  } {
    return {
      treeSitterAvailable: this.codeParser.isTreeSitterAvailable(),
      supportedLanguages: this.codeParser.getSupportedLanguages(),
      parsingMethod: this.codeParser.isTreeSitterAvailable() ? 'Tree-sitter + Regex fallback' : 'Regex-based',
    };
  }
}