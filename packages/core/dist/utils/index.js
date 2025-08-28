"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.formatDate = formatDate;
exports.calculateProcessingTime = calculateProcessingTime;
exports.sanitizeRepoName = sanitizeRepoName;
exports.extractOwnerRepo = extractOwnerRepo;
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
function calculateProcessingTime(start, end) {
    return Math.round((end.getTime() - start.getTime()) / 1000);
}
function sanitizeRepoName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
function extractOwnerRepo(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match)
        throw new Error('Invalid GitHub URL');
    return { owner: match[1], repo: match[2].replace('.git', '') };
}
//# sourceMappingURL=index.js.map