import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import fs from 'fs-extra';
import path from 'path';
import { ParsedFile } from '@kontexto/core';
import { logger } from '../utils/logger';

export class ParserService {
  private jsParser: Parser;
  private tsParser: Parser;
  private pyParser: Parser;

  constructor() {
    this.jsParser = new Parser();
    this.jsParser.setLanguage(JavaScript);

    this.tsParser = new Parser();
    this.tsParser.setLanguage(TypeScript.typescript);

    this.pyParser = new Parser();
    this.pyParser.setLanguage(Python);
  }

  async parseFiles(modifiedFiles: any[], repoPath: string): Promise<ParsedFile[]> {
    const parsedFiles: ParsedFile[] = [];

    for (const file of modifiedFiles) {
      try {
        const filePath = path.join(repoPath, file.path);
        
        if (!(await fs.pathExists(filePath))) {
          logger.warn(`File not found: ${filePath}`);
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const language = this.detectLanguage(file.path);
        
        if (!language) {
          logger.debug(`Skipping unsupported file: ${file.path}`);
          continue;
        }

        const parsed = await this.parseFile(content, language, file.path);
        parsedFiles.push(parsed);
      } catch (error) {
        logger.error(`Failed to parse file ${file.path}:`, error);
      }
    }

    return parsedFiles;
  }

  private async parseFile(content: string, language: string, filePath: string): Promise<ParsedFile> {
    const parser = this.getParser(language);
    const tree = parser.parse(content);

    const parsed: ParsedFile = {
      path: filePath,
      language,
      content,
      ast: tree.rootNode,
      functions: [],
      classes: [],
      imports: [],
      exports: []
    };

    // Extract functions, classes, imports, exports
    this.extractSymbols(tree.rootNode, parsed, content);

    return parsed;
  }

  private detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.py':
        return 'python';
      default:
        return null;
    }
  }

  private getParser(language: string): Parser {
    switch (language) {
      case 'javascript':
        return this.jsParser;
      case 'typescript':
        return this.tsParser;
      case 'python':
        return this.pyParser;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private extractSymbols(node: any, parsed: ParsedFile, content: string) {
    const lines = content.split('\n');

    const traverse = (n: any) => {
      switch (n.type) {
        case 'function_declaration':
        case 'function_expression':
        case 'arrow_function':
          this.extractFunction(n, parsed, lines);
          break;
        case 'class_declaration':
          this.extractClass(n, parsed, lines);
          break;
        case 'import_statement':
        case 'import_declaration':
          this.extractImport(n, parsed, content);
          break;
        case 'export_statement':
        case 'export_declaration':
          this.extractExport(n, parsed, content);
          break;
      }

      for (const child of n.children) {
        traverse(child);
      }
    };

    traverse(node);
  }

  private extractFunction(node: any, parsed: ParsedFile, lines: string[]) {
    try {
      const nameNode = node.childForFieldName('name');
      const paramsNode = node.childForFieldName('parameters');
      
      const name = nameNode ? nameNode.text : 'anonymous';
      const line = node.startPosition.row + 1;
      const params = paramsNode ? this.extractParameters(paramsNode) : [];

      parsed.functions!.push({
        name,
        line,
        params,
        returnType: this.extractReturnType(node)
      });
    } catch (error) {
      logger.debug('Failed to extract function:', error);
    }
  }

  private extractClass(node: any, parsed: ParsedFile, lines: string[]) {
    try {
      const nameNode = node.childForFieldName('name');
      const bodyNode = node.childForFieldName('body');
      
      const name = nameNode ? nameNode.text : 'anonymous';
      const line = node.startPosition.row + 1;
      const methods = bodyNode ? this.extractMethods(bodyNode) : [];

      parsed.classes!.push({
        name,
        line,
        methods
      });
    } catch (error) {
      logger.debug('Failed to extract class:', error);
    }
  }

  private extractImport(node: any, parsed: ParsedFile, content: string) {
    try {
      const importText = content.slice(node.startIndex, node.endIndex);
      parsed.imports!.push(importText.trim());
    } catch (error) {
      logger.debug('Failed to extract import:', error);
    }
  }

  private extractExport(node: any, parsed: ParsedFile, content: string) {
    try {
      const exportText = content.slice(node.startIndex, node.endIndex);
      parsed.exports!.push(exportText.trim());
    } catch (error) {
      logger.debug('Failed to extract export:', error);
    }
  }

  private extractParameters(paramsNode: any): string[] {
    const params: string[] = [];
    
    for (const child of paramsNode.children) {
      if (child.type === 'identifier' || child.type === 'parameter') {
        params.push(child.text);
      }
    }
    
    return params;
  }

  private extractReturnType(node: any): string | undefined {
    const returnTypeNode = node.childForFieldName('return_type');
    return returnTypeNode ? returnTypeNode.text : undefined;
  }

  private extractMethods(bodyNode: any): string[] {
    const methods: string[] = [];
    
    const traverse = (n: any) => {
      if (n.type === 'method_definition' || n.type === 'function_declaration') {
        const nameNode = n.childForFieldName('name');
        if (nameNode) {
          methods.push(nameNode.text);
        }
      }
      
      for (const child of n.children) {
        traverse(child);
      }
    };
    
    traverse(bodyNode);
    return methods;
  }
}
