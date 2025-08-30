"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.formatDate = formatDate;
exports.relativeTime = relativeTime;
exports.slugify = slugify;
exports.extractRepoInfo = extractRepoInfo;
exports.calculateComplexity = calculateComplexity;
exports.sanitizeHTML = sanitizeHTML;
exports.debounce = debounce;
exports.throttle = throttle;
const cuid_1 = __importDefault(require("cuid"));
function generateId() {
    return (0, cuid_1.default)();
}
function formatDate(date) {
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
function relativeTime(date) {
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
function slugify(text) {
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
function extractRepoInfo(url) {
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
function calculateComplexity(code) {
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
function sanitizeHTML(html) {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '');
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=utils.js.map