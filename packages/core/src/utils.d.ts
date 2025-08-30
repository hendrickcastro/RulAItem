export declare function generateId(): string;
export declare function formatDate(date: Date): string;
export declare function relativeTime(date: Date): string;
export declare function slugify(text: string): string;
export declare function extractRepoInfo(url: string): {
    owner: string;
    repo: string;
    provider: 'github' | 'gitlab' | 'bitbucket';
} | null;
export declare function calculateComplexity(code: string): number;
export declare function sanitizeHTML(html: string): string;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=utils.d.ts.map