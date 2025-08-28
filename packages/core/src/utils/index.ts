export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function calculateProcessingTime(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 1000);
}

export function sanitizeRepoName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export function extractOwnerRepo(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2].replace('.git', '') };
}
