import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale);
}

export function formatDateTime(date: string | Date, locale = 'es-ES') {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getElapsedTime(startDate: string | Date, endDate?: string | Date) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
  
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m`;
  return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
}

export function extractRepoPath(repoUrl: string): string {
  try {
    return new URL(repoUrl).pathname;
  } catch {
    return repoUrl.replace('https://github.com/', '');
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}