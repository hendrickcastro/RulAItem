import cuid from 'cuid';

export function generateId(): string {
  return cuid();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function relativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const diff = Date.now() - date.getTime();
  const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) {
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diff / (1000 * 60));
      return rtf.format(-diffInMinutes, 'minute');
    }
    return rtf.format(-diffInHours, 'hour');
  }
  
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day');
  }
  
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return rtf.format(-diffInWeeks, 'week');
  }
  
  if (diffInDays < 365) {
    const diffInMonths = Math.floor(diffInDays / 30);
    return rtf.format(-diffInMonths, 'month');
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function extractRepoInfo(url: string): {
  owner: string;
  repo: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
} | null {
  const githubRegex = /github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/;
  const gitlabRegex = /gitlab\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/;
  const bitbucketRegex = /bitbucket\.org[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/;

  let match = url.match(githubRegex);
  if (match) {
    return { owner: match[1], repo: match[2], provider: 'github' };
  }

  match = url.match(gitlabRegex);
  if (match) {
    return { owner: match[1], repo: match[2], provider: 'gitlab' };
  }

  match = url.match(bitbucketRegex);
  if (match) {
    return { owner: match[1], repo: match[2], provider: 'bitbucket' };
  }

  return null;
}

export function calculateComplexity(code: string): number {
  // Simple cyclomatic complexity calculation
  const patterns = [
    /\bif\b/g,
    /\belse\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\btry\b/g,
    /\?\s*:/g, // ternary operators
  ];

  let complexity = 1; // Base complexity

  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

export function sanitizeHTML(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}