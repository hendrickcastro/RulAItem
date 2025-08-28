import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    javascript: '#f1e05a',
    typescript: '#2b7489',
    python: '#3572a5',
    java: '#b07219',
    go: '#00add8',
    rust: '#dea584',
    php: '#4f5d95',
    ruby: '#701516',
    c: '#555555',
    cpp: '#f34b7d',
    csharp: '#239120',
    swift: '#ffac45',
    kotlin: '#f18e33',
    scala: '#dc322f',
    clojure: '#db5855',
  };

  return colors[language.toLowerCase()] || '#6b7280';
}

export function getRiskLevelColor(risk: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
  };

  return colors[risk];
}

export function getComplexityColor(complexity: 'simple' | 'moderate' | 'complex'): string {
  const colors = {
    simple: 'text-green-600 bg-green-50',
    moderate: 'text-yellow-600 bg-yellow-50',
    complex: 'text-red-600 bg-red-50',
  };

  return colors[complexity];
}

export function getJobStatusColor(status: string): string {
  const colors = {
    pending: 'text-gray-600 bg-gray-50',
    processing: 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
  };

  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}