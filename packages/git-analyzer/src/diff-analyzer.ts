import { GitDiffFile, DiffChunk, DiffLine, DiffAnalysis, ParsedCode } from './types';

export class DiffAnalyzer {
  parseDiff(diffString: string): GitDiffFile[] {
    const files: GitDiffFile[] = [];
    const diffLines = diffString.split('\n');
    
    let currentFile: Partial<GitDiffFile> | null = null;
    let currentChunk: Partial<DiffChunk> | null = null;
    
    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      
      // File header
      if (line.startsWith('diff --git')) {
        if (currentFile) {
          files.push(currentFile as GitDiffFile);
        }
        currentFile = this.parseFileHeader(line, diffLines, i);
        continue;
      }
      
      // Chunk header
      if (line.startsWith('@@') && currentFile) {
        if (currentChunk) {
          currentFile.chunks = currentFile.chunks || [];
          currentFile.chunks.push(currentChunk as DiffChunk);
        }
        currentChunk = this.parseChunkHeader(line);
        continue;
      }
      
      // Diff line
      if (currentChunk && currentFile && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        const diffLine = this.parseDiffLine(line);
        currentChunk.lines = currentChunk.lines || [];
        currentChunk.lines.push(diffLine);
        
        if (diffLine.type === 'add') {
          currentFile.additions = currentFile.additions || [];
          currentFile.additions.push(diffLine.content);
        } else if (diffLine.type === 'delete') {
          currentFile.deletions = currentFile.deletions || [];
          currentFile.deletions.push(diffLine.content);
        }
      }
    }
    
    // Add last file and chunk
    if (currentChunk && currentFile) {
      currentFile.chunks = currentFile.chunks || [];
      currentFile.chunks.push(currentChunk as DiffChunk);
    }
    if (currentFile) {
      files.push(currentFile as GitDiffFile);
    }
    
    return files;
  }

  analyzeDiff(beforeCode: ParsedCode | null, afterCode: ParsedCode | null): DiffAnalysis {
    const analysis: DiffAnalysis = {
      addedFunctions: [],
      removedFunctions: [],
      modifiedFunctions: [],
      addedClasses: [],
      removedClasses: [],
      modifiedClasses: [],
      complexityChange: 0,
      riskLevel: 'low',
    };

    if (!beforeCode && afterCode) {
      // New file
      analysis.addedFunctions = afterCode.functions;
      analysis.addedClasses = afterCode.classes;
      analysis.complexityChange = afterCode.complexity;
      analysis.riskLevel = this.calculateRiskLevel(analysis.complexityChange, analysis.addedFunctions.length, 0);
    } else if (beforeCode && !afterCode) {
      // Deleted file
      analysis.removedFunctions = beforeCode.functions;
      analysis.removedClasses = beforeCode.classes;
      analysis.complexityChange = -beforeCode.complexity;
      analysis.riskLevel = 'high'; // File deletion is high risk
    } else if (beforeCode && afterCode) {
      // Modified file
      this.compareFunctions(beforeCode.functions, afterCode.functions, analysis);
      this.compareClasses(beforeCode.classes, afterCode.classes, analysis);
      analysis.complexityChange = afterCode.complexity - beforeCode.complexity;
      
      const totalChanges = analysis.addedFunctions.length + 
                         analysis.removedFunctions.length + 
                         analysis.modifiedFunctions.length;
      analysis.riskLevel = this.calculateRiskLevel(analysis.complexityChange, totalChanges, beforeCode.functions.length);
    }

    return analysis;
  }

  private parseFileHeader(line: string, allLines: string[], startIndex: number): Partial<GitDiffFile> {
    const file: Partial<GitDiffFile> = {
      additions: [],
      deletions: [],
      chunks: [],
      isNew: false,
      isDeleted: false,
      isRenamed: false,
    };

    // Extract file paths from "diff --git a/path b/path"
    const match = line.match(/diff --git a\/(.+) b\/(.+)/);
    if (match) {
      file.oldPath = match[1];
      file.newPath = match[2];
      file.fileName = match[2];
    }

    // Look ahead for file status indicators
    for (let i = startIndex + 1; i < Math.min(startIndex + 10, allLines.length); i++) {
      const nextLine = allLines[i];
      
      if (nextLine.startsWith('new file mode')) {
        file.isNew = true;
      } else if (nextLine.startsWith('deleted file mode')) {
        file.isDeleted = true;
      } else if (nextLine.startsWith('rename from') || nextLine.startsWith('rename to')) {
        file.isRenamed = true;
      } else if (nextLine.startsWith('@@')) {
        break;
      }
    }

    return file;
  }

  private parseChunkHeader(line: string): Partial<DiffChunk> {
    // Parse "@@ -oldStart,oldLines +newStart,newLines @@"
    const match = line.match(/@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/);
    if (match) {
      return {
        oldStart: parseInt(match[1], 10),
        oldLines: parseInt(match[2] || '1', 10),
        newStart: parseInt(match[3], 10),
        newLines: parseInt(match[4] || '1', 10),
        lines: [],
      };
    }
    
    return { lines: [] };
  }

  private parseDiffLine(line: string): DiffLine {
    const type = line[0] === '+' ? 'add' : line[0] === '-' ? 'delete' : 'context';
    const content = line.substring(1);
    
    return {
      type,
      content,
    };
  }

  private compareFunctions(
    beforeFunctions: any[],
    afterFunctions: any[],
    analysis: DiffAnalysis
  ): void {
    const beforeMap = new Map(beforeFunctions.map(f => [f.name, f]));
    const afterMap = new Map(afterFunctions.map(f => [f.name, f]));

    // Find added functions
    for (const [name, func] of afterMap) {
      if (!beforeMap.has(name)) {
        analysis.addedFunctions.push(func);
      }
    }

    // Find removed functions
    for (const [name, func] of beforeMap) {
      if (!afterMap.has(name)) {
        analysis.removedFunctions.push(func);
      }
    }

    // Find modified functions
    for (const [name, afterFunc] of afterMap) {
      const beforeFunc = beforeMap.get(name);
      if (beforeFunc && this.isFunctionModified(beforeFunc, afterFunc)) {
        analysis.modifiedFunctions.push(afterFunc);
      }
    }
  }

  private compareClasses(
    beforeClasses: any[],
    afterClasses: any[],
    analysis: DiffAnalysis
  ): void {
    const beforeMap = new Map(beforeClasses.map(c => [c.name, c]));
    const afterMap = new Map(afterClasses.map(c => [c.name, c]));

    // Find added classes
    for (const [name, cls] of afterMap) {
      if (!beforeMap.has(name)) {
        analysis.addedClasses.push(cls);
      }
    }

    // Find removed classes
    for (const [name, cls] of beforeMap) {
      if (!afterMap.has(name)) {
        analysis.removedClasses.push(cls);
      }
    }

    // Find modified classes
    for (const [name, afterClass] of afterMap) {
      const beforeClass = beforeMap.get(name);
      if (beforeClass && this.isClassModified(beforeClass, afterClass)) {
        analysis.modifiedClasses.push(afterClass);
      }
    }
  }

  private isFunctionModified(before: any, after: any): boolean {
    return (
      before.complexity !== after.complexity ||
      before.parameters.length !== after.parameters.length ||
      before.endLine - before.startLine !== after.endLine - after.startLine
    );
  }

  private isClassModified(before: any, after: any): boolean {
    return (
      before.methods.length !== after.methods.length ||
      before.properties.length !== after.properties.length ||
      before.endLine - before.startLine !== after.endLine - after.startLine
    );
  }

  private calculateRiskLevel(
    complexityChange: number,
    changesCount: number,
    originalFunctionCount: number
  ): 'low' | 'medium' | 'high' {
    const changeRatio = originalFunctionCount > 0 ? changesCount / originalFunctionCount : 1;
    
    if (complexityChange > 20 || changeRatio > 0.5) {
      return 'high';
    } else if (complexityChange > 10 || changeRatio > 0.25) {
      return 'medium';
    }
    
    return 'low';
  }
}