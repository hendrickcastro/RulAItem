import { ParsedCode, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, CommentInfo } from './types';

/**
 * Robust code parser that gracefully handles Tree-sitter availability
 * Falls back to regex-based parsing when Tree-sitter is unavailable
 */
export class RobustCodeParser {
  private treeSitterAvailable = false;
  private parsers: Map<string, any> = new Map();

  constructor() {
    this.initializeTreeSitter();
  }

  private async initializeTreeSitter(): Promise<void> {
    try {
      // Try to load Tree-sitter modules
      const TreeSitter = await import('tree-sitter');
      const JavaScript = await import('tree-sitter-javascript');
      const { typescript, tsx } = await import('tree-sitter-typescript');
      const Python = await import('tree-sitter-python');
      const Java = await import('tree-sitter-java');
      const Go = await import('tree-sitter-go');

      // Initialize parsers
      const jsParser = new TreeSitter.default();
      jsParser.setLanguage(JavaScript.default);
      this.parsers.set('javascript', jsParser);
      this.parsers.set('js', jsParser);
      this.parsers.set('jsx', jsParser);

      const tsParser = new TreeSitter.default();
      tsParser.setLanguage(typescript);
      this.parsers.set('typescript', tsParser);
      this.parsers.set('ts', tsParser);

      const tsxParser = new TreeSitter.default();
      tsxParser.setLanguage(tsx);
      this.parsers.set('tsx', tsxParser);

      const pythonParser = new TreeSitter.default();
      pythonParser.setLanguage(Python.default);
      this.parsers.set('python', pythonParser);
      this.parsers.set('py', pythonParser);

      const javaParser = new TreeSitter.default();
      javaParser.setLanguage(Java.default);
      this.parsers.set('java', javaParser);

      const goParser = new TreeSitter.default();
      goParser.setLanguage(Go.default);
      this.parsers.set('go', goParser);

      this.treeSitterAvailable = true;
      console.log('✅ Tree-sitter initialized successfully');
    } catch (error) {
      console.warn('⚠️ Tree-sitter not available, falling back to regex parsing:', error instanceof Error ? error.message : String(error));
      this.treeSitterAvailable = false;
    }
  }

  /**
   * Parse code with the best available method
   */
  async parseCode(content: string, language: string, filePath?: string): Promise<ParsedCode> {
    if (this.treeSitterAvailable && this.parsers.has(language)) {
      return this.parseWithTreeSitter(content, language, filePath);
    } else {
      return this.parseWithRegex(content, language, filePath);
    }
  }

  /**
   * Parse using Tree-sitter (high accuracy)
   */
  private parseWithTreeSitter(content: string, language: string, filePath?: string): ParsedCode {
    const parser = this.parsers.get(language);
    if (!parser) {
      return this.parseWithRegex(content, language, filePath);
    }

    try {
      const tree = parser.parse(content);
      const rootNode = tree.rootNode;

      return {
        language,
        functions: this.extractFunctionsTreeSitter(rootNode, content),
        classes: this.extractClassesTreeSitter(rootNode, content),
        imports: this.extractImportsTreeSitter(rootNode, content),
        exports: this.extractExportsTreeSitter(rootNode, content),
        comments: this.extractCommentsTreeSitter(rootNode, content),
        complexity: this.calculateComplexityTreeSitter(rootNode),
        linesOfCode: content.split('\n').filter(line => line.trim().length > 0).length,
      };
    } catch (error) {
      console.warn(`Tree-sitter parsing failed for ${language}, falling back to regex:`, error instanceof Error ? error.message : String(error));
      return this.parseWithRegex(content, language, filePath);
    }
  }

  /**
   * Parse using regex patterns (fallback, lower accuracy but reliable)
   */
  private parseWithRegex(content: string, language: string, filePath?: string): ParsedCode {
    const lines = content.split('\n');
    
    return {
      language,
      functions: this.extractFunctionsRegex(content, language),
      classes: this.extractClassesRegex(content, language),
      imports: this.extractImportsRegex(content, language),
      exports: this.extractExportsRegex(content, language),
      comments: this.extractCommentsRegex(content, language),
      complexity: this.calculateComplexityRegex(content),
      linesOfCode: lines.filter(line => line.trim().length > 0).length,
    };
  }

  // Tree-sitter extraction methods
  private extractFunctionsTreeSitter(node: any, content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const functionTypes = ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'];

    const traverse = (currentNode: any) => {
      if (functionTypes.includes(currentNode.type)) {
        const nameNode = currentNode.childForFieldName?.('name') || 
                        currentNode.child(1); // Fallback for when childForFieldName doesn't exist
        
        functions.push({
          name: nameNode?.text || 'anonymous',
          startLine: currentNode.startPosition.row + 1,
          endLine: currentNode.endPosition.row + 1,
          parameters: this.extractParametersTreeSitter(currentNode),
          complexity: this.calculateNodeComplexity(currentNode),
        });
      }

      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        if (child) traverse(child);
      }
    };

    traverse(node);
    return functions;
  }

  private extractClassesTreeSitter(node: any, content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const classTypes = ['class_declaration', 'class_expression'];

    const traverse = (currentNode: any) => {
      if (classTypes.includes(currentNode.type)) {
        const nameNode = currentNode.childForFieldName?.('name') || currentNode.child(1);
        
        classes.push({
          name: nameNode?.text || 'anonymous',
          startLine: currentNode.startPosition.row + 1,
          endLine: currentNode.endPosition.row + 1,
          methods: [], // Would need more detailed extraction
          properties: [],
        });
      }

      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        if (child) traverse(child);
      }
    };

    traverse(node);
    return classes;
  }

  private extractImportsTreeSitter(node: any, content: string): ImportInfo[] {
    // Simplified implementation - would extract actual imports
    return [];
  }

  private extractExportsTreeSitter(node: any, content: string): ExportInfo[] {
    // Simplified implementation - would extract actual exports
    return [];
  }

  private extractCommentsTreeSitter(node: any, content: string): CommentInfo[] {
    const comments: CommentInfo[] = [];
    
    const traverse = (currentNode: any) => {
      if (currentNode.type === 'comment') {
        comments.push({
          type: currentNode.text.startsWith('//') ? 'line' : 'block',
          content: currentNode.text,
          line: currentNode.startPosition.row + 1,
          endLine: currentNode.endPosition.row + 1,
        });
      }

      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        if (child) traverse(child);
      }
    };

    traverse(node);
    return comments;
  }

  private extractParametersTreeSitter(functionNode: any): string[] {
    const params = functionNode.childForFieldName?.('parameters');
    if (!params) return [];

    const parameters: string[] = [];
    for (let i = 0; i < params.childCount; i++) {
      const param = params.child(i);
      if (param && param.type === 'identifier') {
        parameters.push(param.text);
      }
    }
    return parameters;
  }

  private calculateComplexityTreeSitter(node: any): number {
    let complexity = 1; // Base complexity

    const complexityNodes = [
      'if_statement', 'while_statement', 'for_statement', 'for_in_statement',
      'switch_statement', 'case_clause', 'catch_clause', 'conditional_expression'
    ];

    const traverse = (currentNode: any) => {
      if (complexityNodes.includes(currentNode.type)) {
        complexity++;
      }

      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        if (child) traverse(child);
      }
    };

    traverse(node);
    return complexity;
  }

  private calculateNodeComplexity(node: any): number {
    // Simplified node-specific complexity calculation
    return this.calculateComplexityTreeSitter(node);
  }

  // Regex-based extraction methods (fallback)
  private extractFunctionsRegex(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');

    let patterns: RegExp[] = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'js':
      case 'ts':
        patterns = [
          /function\s+(\w+)\s*\(/g,
          /(\w+)\s*:\s*function\s*\(/g,
          /(\w+)\s*=\s*function\s*\(/g,
          /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
          /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
        ];
        break;
      case 'python':
        patterns = [/def\s+(\w+)\s*\(/g];
        break;
      case 'java':
        patterns = [/(?:public|private|protected)?\s*(?:static)?\s*(?:\w+)\s+(\w+)\s*\(/g];
        break;
      case 'go':
        patterns = [/func\s+(\w+)\s*\(/g];
        break;
    }

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        functions.push({
          name,
          startLine: lineNumber,
          endLine: lineNumber, // Simplified - would need proper end detection
          parameters: [],
          complexity: 5, // Default complexity
        });
      }
    });

    return functions;
  }

  private extractClassesRegex(content: string, language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    let patterns: RegExp[] = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns = [/class\s+(\w+)/g];
        break;
      case 'python':
        patterns = [/class\s+(\w+)/g];
        break;
      case 'java':
        patterns = [/(?:public|private|protected)?\s*class\s+(\w+)/g];
        break;
    }

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        classes.push({
          name,
          startLine: lineNumber,
          endLine: lineNumber,
          methods: [],
          properties: [],
        });
      }
    });

    return classes;
  }

  private extractImportsRegex(content: string, language: string): ImportInfo[] {
    // Simplified regex-based import extraction
    return [];
  }

  private extractExportsRegex(content: string, language: string): ExportInfo[] {
    // Simplified regex-based export extraction
    return [];
  }

  private extractCommentsRegex(content: string, language: string): CommentInfo[] {
    const comments: CommentInfo[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//')) {
        comments.push({
          type: 'line',
          content: trimmedLine,
          line: index + 1,
        });
      }
    });

    // Block comments would need more sophisticated regex
    const blockCommentPattern = /\/\*[\s\S]*?\*\//g;
    let match;
    while ((match = blockCommentPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      comments.push({
        type: 'block',
        content: match[0],
        line: lineNumber,
      });
    }

    return comments;
  }

  private calculateComplexityRegex(content: string): number {
    let complexity = 1;
    const complexityPatterns = [
      /\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g,
      /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\?\s*:/g
    ];

    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Check if Tree-sitter is available
   */
  isTreeSitterAvailable(): boolean {
    return this.treeSitterAvailable;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    if (this.treeSitterAvailable) {
      return Array.from(this.parsers.keys());
    } else {
      return ['javascript', 'typescript', 'python', 'java', 'go'];
    }
  }
}