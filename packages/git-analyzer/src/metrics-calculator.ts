import { ParsedCode, CodeMetrics } from './types';

export class MetricsCalculator {
  calculateMetrics(parsedFiles: ParsedCode[]): CodeMetrics {
    let totalLinesOfCode = 0;
    let totalComplexity = 0;
    const dependencies = new Set<string>();
    const filesCount = parsedFiles.length;

    parsedFiles.forEach(file => {
      totalLinesOfCode += file.linesOfCode;
      totalComplexity += file.complexity;
      
      // Collect dependencies from imports
      file.imports.forEach(imp => {
        dependencies.add(imp.module);
      });
    });

    const averageComplexity = filesCount > 0 ? totalComplexity / filesCount : 0;

    return {
      linesOfCode: totalLinesOfCode,
      complexity: Math.round(averageComplexity * 10) / 10,
      maintainabilityIndex: this.calculateMaintainabilityIndex(totalLinesOfCode, totalComplexity),
      technicalDebt: this.calculateTechnicalDebt(totalComplexity, totalLinesOfCode),
    };
  }

  calculateFileMetrics(file: ParsedCode): {
    functionsCount: number;
    classesCount: number;
    averageFunctionComplexity: number;
    longestFunction: number;
    commentsRatio: number;
  } {
    const functionsCount = file.functions.length;
    const classesCount = file.classes.length;
    
    const functionComplexities = file.functions.map(f => f.complexity);
    const averageFunctionComplexity = functionComplexities.length > 0 
      ? functionComplexities.reduce((a, b) => a + b, 0) / functionComplexities.length 
      : 0;
    
    const longestFunction = file.functions.length > 0
      ? Math.max(...file.functions.map(f => f.endLine - f.startLine + 1))
      : 0;

    const totalCommentLines = file.comments.reduce((sum, comment) => {
      return sum + (comment.endLine ? comment.endLine - comment.line + 1 : 1);
    }, 0);
    
    const commentsRatio = file.linesOfCode > 0 ? totalCommentLines / file.linesOfCode : 0;

    return {
      functionsCount,
      classesCount,
      averageFunctionComplexity: Math.round(averageFunctionComplexity * 10) / 10,
      longestFunction,
      commentsRatio: Math.round(commentsRatio * 100) / 100,
    };
  }

  calculateQualityScore(file: ParsedCode): number {
    const metrics = this.calculateFileMetrics(file);
    let score = 100;

    // Deduct points for high complexity
    if (metrics.averageFunctionComplexity > 10) {
      score -= 20;
    } else if (metrics.averageFunctionComplexity > 5) {
      score -= 10;
    }

    // Deduct points for very long functions
    if (metrics.longestFunction > 100) {
      score -= 15;
    } else if (metrics.longestFunction > 50) {
      score -= 5;
    }

    // Deduct points for lack of comments
    if (metrics.commentsRatio < 0.1) {
      score -= 15;
    } else if (metrics.commentsRatio < 0.2) {
      score -= 5;
    }

    // Bonus points for good practices
    if (metrics.commentsRatio > 0.3) {
      score += 5;
    }

    if (metrics.averageFunctionComplexity < 3) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  generateQualityReport(files: ParsedCode[]): {
    overallScore: number;
    totalFiles: number;
    highComplexityFiles: string[];
    poorlyCommentedFiles: string[];
    recommendations: string[];
  } {
    const scores = files.map(f => this.calculateQualityScore(f));
    const overallScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 0;

    const highComplexityFiles: string[] = [];
    const poorlyCommentedFiles: string[] = [];
    const recommendations: string[] = [];

    files.forEach((file, index) => {
      const metrics = this.calculateFileMetrics(file);
      
      if (metrics.averageFunctionComplexity > 10) {
        highComplexityFiles.push(`File ${index + 1} (complexity: ${metrics.averageFunctionComplexity})`);
      }

      if (metrics.commentsRatio < 0.1) {
        poorlyCommentedFiles.push(`File ${index + 1} (comments: ${Math.round(metrics.commentsRatio * 100)}%)`);
      }
    });

    // Generate recommendations
    if (highComplexityFiles.length > 0) {
      recommendations.push(`Consider refactoring ${highComplexityFiles.length} high-complexity files`);
    }

    if (poorlyCommentedFiles.length > 0) {
      recommendations.push(`Add documentation to ${poorlyCommentedFiles.length} poorly commented files`);
    }

    if (overallScore < 70) {
      recommendations.push('Overall code quality needs improvement');
    } else if (overallScore > 85) {
      recommendations.push('Excellent code quality maintained');
    }

    return {
      overallScore,
      totalFiles: files.length,
      highComplexityFiles,
      poorlyCommentedFiles,
      recommendations,
    };
  }

  private calculateMaintainabilityIndex(linesOfCode: number, complexity: number): number {
    // Simplified maintainability index calculation
    const base = 171;
    const complexityPenalty = 5.2 * Math.log(complexity || 1);
    const sizePenalty = 0.23 * (linesOfCode || 1);
    
    return Math.max(0, Math.min(100, base - complexityPenalty - sizePenalty));
  }

  private calculateTechnicalDebt(complexity: number, linesOfCode: number): number {
    // Technical debt estimation in hours
    const complexityDebt = Math.max(0, complexity - 10) * 0.5;
    const sizeDebt = Math.max(0, linesOfCode - 1000) * 0.001;
    
    return Math.round((complexityDebt + sizeDebt) * 10) / 10;
  }
}