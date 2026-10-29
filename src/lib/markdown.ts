import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

export function firstParagraph(markdown: string): string {
  const match = markdown.replace(/^#.*$/gm, '').match(/[^\n]+/);
  return match ? match[0].slice(0, 220) : '';
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}
