/**
 * Type declarations for Tree-sitter modules
 * This provides TypeScript support without depending on @types packages
 */

declare module 'tree-sitter' {
  export interface SyntaxNode {
    type: string;
    text: string;
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
    childCount: number;
    namedChildCount: number;
    firstChild: SyntaxNode | null;
    firstNamedChild: SyntaxNode | null;
    lastChild: SyntaxNode | null;
    lastNamedChild: SyntaxNode | null;
    nextSibling: SyntaxNode | null;
    nextNamedSibling: SyntaxNode | null;
    previousSibling: SyntaxNode | null;
    previousNamedSibling: SyntaxNode | null;
    parent: SyntaxNode | null;
    children: SyntaxNode[];
    namedChildren: SyntaxNode[];
    child(index: number): SyntaxNode | null;
    namedChild(index: number): SyntaxNode | null;
    childForFieldName(fieldName: string): SyntaxNode | null;
    childForFieldId(fieldId: number): SyntaxNode | null;
    fieldNameForChild(childIndex: number): string | null;
    walk(): TreeCursor;
    toString(): string;
  }

  export interface TreeCursor {
    nodeType: string;
    nodeText: string;
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
    currentNode(): SyntaxNode;
    reset(node: SyntaxNode): void;
    gotoParent(): boolean;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoFirstChildForIndex(index: number): boolean;
  }

  export interface Point {
    row: number;
    column: number;
  }

  export interface Range {
    startIndex: number;
    endIndex: number;
    startPosition: Point;
    endPosition: Point;
  }

  export interface Tree {
    rootNode: SyntaxNode;
    copy(): Tree;
    edit(edit: Edit): void;
    walk(): TreeCursor;
    getChangedRanges(oldTree: Tree): Range[];
    getIncludedRanges(): Range[];
    getLanguage(): Language;
  }

  export interface Edit {
    startIndex: number;
    oldEndIndex: number;
    newEndIndex: number;
    startPosition: Point;
    oldEndPosition: Point;
    newEndPosition: Point;
  }

  export interface Language {
    version: number;
    nodeTypeCount: number;
    fieldCount: number;
    nodeTypeForId(typeId: number): string;
    fieldNameForId(fieldId: number): string;
    fieldIdForName(fieldName: string): number;
    idForNodeType(type: string, named: boolean): number;
  }

  export interface Parser {
    parse(input: string | Input, oldTree?: Tree, options?: { includedRanges?: Range[] }): Tree;
    getLanguage(): Language | null;
    setLanguage(language: Language): void;
    getTimeoutMicros(): number;
    setTimeoutMicros(timeoutMicros: number): void;
    reset(): void;
  }

  export interface Input {
    read(offset: number, position: Point): string | null;
  }

  export interface QueryCapture {
    name: string;
    node: SyntaxNode;
  }

  export interface QueryMatch {
    pattern: number;
    captures: QueryCapture[];
  }

  export interface Query {
    matches(node: SyntaxNode, startPosition?: Point, endPosition?: Point): QueryMatch[];
    captures(node: SyntaxNode, startPosition?: Point, endPosition?: Point): QueryCapture[];
  }

  class Parser {
    constructor();
  }

  class Query {
    constructor(language: Language, source: string);
  }

  export default Parser;
}

declare module 'tree-sitter-javascript' {
  import { Language } from 'tree-sitter';
  const JavaScript: Language;
  export default JavaScript;
}

declare module 'tree-sitter-typescript' {
  import { Language } from 'tree-sitter';
  export const typescript: Language;
  export const tsx: Language;
}

declare module 'tree-sitter-python' {
  import { Language } from 'tree-sitter';
  const Python: Language;
  export default Python;
}

declare module 'tree-sitter-java' {
  import { Language } from 'tree-sitter';
  const Java: Language;
  export default Java;
}

declare module 'tree-sitter-go' {
  import { Language } from 'tree-sitter';
  const Go: Language;
  export default Go;
}