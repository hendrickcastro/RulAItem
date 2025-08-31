import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';
import Go from 'tree-sitter-go';
import { promises as fs } from 'fs';
import { extname } from 'path';
import {
  ParsedCode,
  FunctionInfo,
  ClassInfo,
  ImportInfo,
  ExportInfo,
  CommentInfo,
  PropertyInfo,
  LanguageConfig,
} from './types';
import { calculateComplexity, SUPPORTED_LANGUAGES, FILE_EXTENSIONS } from '@kontexto/core';

export class CodeParser {
  private parsers: Map<string, Parser> = new Map();
  private languageConfigs: Map<string, LanguageConfig> = new Map();

  constructor() {
    this.initializeParsers();
    this.initializeLanguageConfigs();
  }

  private initializeParsers(): void {
    // JavaScript
    const jsParser = new Parser();
    jsParser.setLanguage(JavaScript);
    this.parsers.set('javascript', jsParser);

    // TypeScript
    const tsParser = new Parser();
    tsParser.setLanguage(TypeScript.typescript);
    this.parsers.set('typescript', tsParser);

    // TSX
    const tsxParser = new Parser();
    tsxParser.setLanguage(TypeScript.tsx);
    this.parsers.set('tsx', tsxParser);

    // Python
    const pyParser = new Parser();
    pyParser.setLanguage(Python);
    this.parsers.set('python', pyParser);

    // Java
    const javaParser = new Parser();
    javaParser.setLanguage(Java);
    this.parsers.set('java', javaParser);

    // Go
    const goParser = new Parser();
    goParser.setLanguage(Go);
    this.parsers.set('go', goParser);
  }

  private initializeLanguageConfigs(): void {
    this.languageConfigs.set('javascript', {
      extensions: [...FILE_EXTENSIONS.javascript],
      parser: 'javascript',
      commentPatterns: {
        line: ['//'],
        block: [{ start: '/*', end: '*/' }],
      },
    });

    this.languageConfigs.set('typescript', {
      extensions: [...FILE_EXTENSIONS.typescript],
      parser: 'typescript',
      commentPatterns: {
        line: ['//'],
        block: [{ start: '/*', end: '*/' }],
      },
    });

    this.languageConfigs.set('python', {
      extensions: [...FILE_EXTENSIONS.python],
      parser: 'python',
      commentPatterns: {
        line: ['#'],
        block: [{ start: '"""', end: '"""' }, { start: "'''", end: "'''" }],
      },
    });

    this.languageConfigs.set('java', {
      extensions: [...FILE_EXTENSIONS.java],
      parser: 'java',
      commentPatterns: {
        line: ['//'],
        block: [{ start: '/*', end: '*/' }],
      },
    });

    this.languageConfigs.set('go', {
      extensions: [...FILE_EXTENSIONS.go],
      parser: 'go',
      commentPatterns: {
        line: ['//'],
        block: [{ start: '/*', end: '*/' }],
      },
    });
  }

  async parseFile(filePath: string): Promise<ParsedCode | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseCode(content, filePath);
    } catch (error: any) {
      console.error(`Failed to parse file ${filePath}:`, error.message);
      return null;
    }
  }

  parseCode(content: string, filePath?: string): ParsedCode | null {
    const language = this.detectLanguage(filePath || '');
    if (!language) {
      return null;
    }

    const parser = this.parsers.get(language);
    if (!parser) {
      return null;
    }

    try {
      const tree = parser.parse(content);
      const root = tree.rootNode;

      const functions = this.extractFunctions(root, content, language);
      const classes = this.extractClasses(root, content, language);
      const imports = this.extractImports(root, content, language);
      const exports = this.extractExports(root, content, language);
      const comments = this.extractComments(content, language);
      
      const complexity = calculateComplexity(content);
      const linesOfCode = content.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#')
      ).length;

      return {
        language,
        functions,
        classes,
        imports,
        exports,
        comments,
        complexity,
        linesOfCode,
      };
    } catch (error: any) {
      console.error(`Failed to parse code:`, error.message);
      return null;
    }
  }

  private detectLanguage(filePath: string): string | null {
    const ext = extname(filePath).toLowerCase();
    
    for (const [language, config] of this.languageConfigs) {
      if (config.extensions.includes(ext)) {
        // Special handling for TypeScript JSX
        if (ext === '.tsx') {
          return 'tsx';
        }
        return language;
      }
    }

    return null;
  }

  private extractFunctions(root: Parser.SyntaxNode, content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');

    const traverse = (node: Parser.SyntaxNode) => {
      // Handle different function types based on language
      if (this.isFunctionNode(node, language)) {
        const func = this.parseFunctionNode(node, lines, language);
        if (func) {
          functions.push(func);
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(root);
    return functions;
  }

  private extractClasses(root: Parser.SyntaxNode, content: string, language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const lines = content.split('\n');

    const traverse = (node: Parser.SyntaxNode) => {
      if (this.isClassNode(node, language)) {
        const cls = this.parseClassNode(node, lines, language);
        if (cls) {
          classes.push(cls);
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(root);
    return classes;
  }

  private extractImports(root: Parser.SyntaxNode, content: string, language: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    const traverse = (node: Parser.SyntaxNode) => {
      if (this.isImportNode(node, language)) {
        const imp = this.parseImportNode(node, language);
        if (imp) {
          imports.push(imp);
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(root);
    return imports;
  }

  private extractExports(root: Parser.SyntaxNode, content: string, language: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    const traverse = (node: Parser.SyntaxNode) => {
      if (this.isExportNode(node, language)) {
        const exp = this.parseExportNode(node, language);
        if (exp) {
          exports.push(exp);
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i)!);
      }
    };

    traverse(root);
    return exports;
  }

  private extractComments(content: string, language: string): CommentInfo[] {
    const comments: CommentInfo[] = [];
    const lines = content.split('\n');
    const config = this.languageConfigs.get(language);
    
    if (!config) return comments;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for line comments
      for (const pattern of config.commentPatterns.line) {
        if (trimmed.startsWith(pattern)) {
          comments.push({
            type: 'line',
            content: trimmed.substring(pattern.length).trim(),
            line: i + 1,
          });
          break;
        }
      }

      // Check for block comments (simplified)
      for (const pattern of config.commentPatterns.block) {
        if (trimmed.includes(pattern.start)) {
          let content = '';
          let endLine = i;
          
          if (trimmed.includes(pattern.end) && trimmed.indexOf(pattern.end) > trimmed.indexOf(pattern.start)) {
            // Single line block comment
            const start = trimmed.indexOf(pattern.start) + pattern.start.length;
            const end = trimmed.indexOf(pattern.end);
            content = trimmed.substring(start, end).trim();
          } else {
            // Multi-line block comment
            content = trimmed.substring(trimmed.indexOf(pattern.start) + pattern.start.length);
            
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();
              if (nextLine.includes(pattern.end)) {
                content += '\n' + nextLine.substring(0, nextLine.indexOf(pattern.end));
                endLine = j;
                break;
              } else {
                content += '\n' + nextLine;
                endLine = j;
              }
            }
          }

          comments.push({
            type: 'block',
            content: content.trim(),
            line: i + 1,
            endLine: endLine + 1,
          });
          break;
        }
      }
    }

    return comments;
  }

  private isFunctionNode(node: Parser.SyntaxNode, language: string): boolean {
    const functionTypes = {
      javascript: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
      typescript: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
      tsx: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
      python: ['function_definition'],
      java: ['method_declaration'],
      go: ['function_declaration', 'method_declaration'],
    };

    return functionTypes[language as keyof typeof functionTypes]?.includes(node.type) || false;
  }

  private isClassNode(node: Parser.SyntaxNode, language: string): boolean {
    const classTypes = {
      javascript: ['class_declaration'],
      typescript: ['class_declaration'],
      tsx: ['class_declaration'],
      python: ['class_definition'],
      java: ['class_declaration'],
      go: ['type_declaration'], // Go structs
    };

    return classTypes[language as keyof typeof classTypes]?.includes(node.type) || false;
  }

  private isImportNode(node: Parser.SyntaxNode, language: string): boolean {
    const importTypes: Record<string, string[]> = {
      javascript: ['import_statement'],
      typescript: ['import_statement'],
      tsx: ['import_statement'],
      python: ['import_statement', 'import_from_statement'],
      java: ['import_declaration'],
      go: ['import_declaration'],
    };

    const langImportTypes = importTypes[language as keyof typeof importTypes];
    return langImportTypes ? langImportTypes.includes(node.type) : false;
  }

  private isExportNode(node: Parser.SyntaxNode, language: string): boolean {
    const exportTypes: Record<string, string[]> = {
      javascript: ['export_statement'],
      typescript: ['export_statement'],
      tsx: ['export_statement'],
      python: [], // Python doesn't have explicit exports
      java: [], // Java uses public/private
      go: [], // Go uses capitalization
    };

    const langExportTypes = exportTypes[language as keyof typeof exportTypes];
    return langExportTypes ? langExportTypes.includes(node.type) : false;
  }

  private parseFunctionNode(node: Parser.SyntaxNode, lines: string[], language: string): FunctionInfo | null {
    try {
      const name = this.extractFunctionName(node, language);
      const parameters = this.extractFunctionParameters(node, language);
      const returnType = this.extractFunctionReturnType(node, language);
      
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      
      // Get function content for complexity calculation
      const functionContent = lines.slice(startLine - 1, endLine).join('\n');
      const complexity = calculateComplexity(functionContent);
      
      // Look for docstring/comment before function
      const docstring = this.extractDocstring(node, lines, language);

      return {
        name: name || 'anonymous',
        startLine,
        endLine,
        parameters,
        returnType,
        complexity,
        docstring,
      };
    } catch (error) {
      return null;
    }
  }

  private parseClassNode(node: Parser.SyntaxNode, lines: string[], language: string): ClassInfo | null {
    try {
      const name = this.extractClassName(node, language);
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      
      const methods = this.extractClassMethods(node, lines, language);
      const properties = this.extractClassProperties(node, language);
      const superclass = this.extractSuperclass(node, language);

      return {
        name: name || 'anonymous',
        startLine,
        endLine,
        methods,
        properties,
        superclass,
      };
    } catch (error) {
      return null;
    }
  }

  private parseImportNode(node: Parser.SyntaxNode, language: string): ImportInfo | null {
    try {
      // This is a simplified implementation
      // In practice, you'd need more sophisticated parsing for each language
      const text = node.text;
      
      if (language === 'javascript' || language === 'typescript') {
        // Parse "import { a, b } from 'module'"
        const fromMatch = text.match(/from\s+['"]([^'"]+)['"]/);
        const module = fromMatch?.[1] || '';
        
        const items: string[] = [];
        const itemsMatch = text.match(/import\s*\{([^}]+)\}/);
        if (itemsMatch) {
          items.push(...itemsMatch[1].split(',').map(s => s.trim()));
        }
        
        const defaultMatch = text.match(/import\s+(\w+)\s+from/);
        const isDefault = !!defaultMatch;

        return {
          module,
          items,
          isDefault,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private parseExportNode(node: Parser.SyntaxNode, language: string): ExportInfo | null {
    try {
      const text = node.text;
      
      if (language === 'javascript' || language === 'typescript') {
        const isDefault = text.includes('export default');
        
        if (isDefault) {
          return {
            name: 'default',
            type: 'default',
            isDefault: true,
          };
        }
        
        // Parse named exports
        const nameMatch = text.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/);
        if (nameMatch) {
          const name = nameMatch[1];
          const type = text.includes('function') ? 'function' : 
                      text.includes('class') ? 'class' : 'variable';
          
          return {
            name,
            type: type as any,
            isDefault: false,
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Helper methods (simplified implementations)
  private extractFunctionName(node: Parser.SyntaxNode, language: string): string | null {
    const nameNode = node.childForFieldName ? node.childForFieldName('name') : node.children.find(n => n.type === 'identifier');
    return nameNode?.text || null;
  }

  private extractFunctionParameters(node: Parser.SyntaxNode, language: string): string[] {
    const parametersNode = node.childForFieldName ? node.childForFieldName('parameters') : node.children.find(n => n.type === 'formal_parameters');
    if (!parametersNode) return [];

    const parameters: string[] = [];
    for (let i = 0; i < parametersNode.childCount; i++) {
      const child = parametersNode.child(i);
      if (child && child.type !== ',' && child.type !== '(' && child.type !== ')') {
        parameters.push(child.text.trim());
      }
    }

    return parameters;
  }

  private extractFunctionReturnType(node: Parser.SyntaxNode, language: string): string | undefined {
    // TypeScript only
    if (language === 'typescript' || language === 'tsx') {
      const typeNode = node.childForFieldName ? node.childForFieldName('return_type') : node.children.find(n => n.type === 'type_annotation');
      return typeNode?.text || undefined;
    }
    return undefined;
  }

  private extractClassName(node: Parser.SyntaxNode, language: string): string | null {
    const nameNode = node.childForFieldName ? node.childForFieldName('name') : node.children.find(n => n.type === 'identifier');
    return nameNode?.text || null;
  }

  private extractClassMethods(node: Parser.SyntaxNode, lines: string[], language: string): FunctionInfo[] {
    const methods: FunctionInfo[] = [];
    
    const traverse = (childNode: Parser.SyntaxNode) => {
      if (this.isFunctionNode(childNode, language)) {
        const method = this.parseFunctionNode(childNode, lines, language);
        if (method) {
          methods.push(method);
        }
      }

      for (let i = 0; i < childNode.childCount; i++) {
        traverse(childNode.child(i)!);
      }
    };

    traverse(node);
    return methods;
  }

  private extractClassProperties(node: Parser.SyntaxNode, language: string): PropertyInfo[] {
    // Simplified implementation
    return [];
  }

  private extractSuperclass(node: Parser.SyntaxNode, language: string): string | undefined {
    const superclassNode = node.childForFieldName ? node.childForFieldName('superclass') : node.children.find(n => n.type === 'superclass');
    return superclassNode?.text || undefined;
  }

  private extractDocstring(node: Parser.SyntaxNode, lines: string[], language: string): string | undefined {
    // Look for comment before function
    const startLine = node.startPosition.row;
    if (startLine > 0) {
      const prevLine = lines[startLine - 1]?.trim();
      if (prevLine?.startsWith('/**') || prevLine?.startsWith('"""')) {
        return prevLine;
      }
    }
    return undefined;
  }
}