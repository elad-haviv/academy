/**
 * Small, deliberately boring Markdown renderer for lesson and tutorial bodies.
 *
 * No dependency, no raw HTML pass-through: everything is escaped first, so a
 * lesson body can never inject markup. Supports what the content actually uses
 * — headings, paragraphs, ul/ol, fenced + inline code, bold, italic, links,
 * blockquotes and horizontal rules.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    '<a href="$2" rel="noopener">$1</a>',
  );
  return out;
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let inCode = false;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      flushPara();
      flushList();
      if (inCode) {
        out.push('</code></pre>');
        inCode = false;
      } else {
        out.push('<pre><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(raw));
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length + 1; // page h1 exists; body starts at h2
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushPara();
      flushList();
      out.push('<hr/>');
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (list !== 'ul') {
        flushList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      if (list !== 'ol') {
        flushList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    flushList();
    para.push(line.trim());
  }

  flushPara();
  flushList();
  if (inCode) out.push('</code></pre>');

  return out.join('\n');
}

export function plainText(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(src: string): number {
  return plainText(src).split(' ').filter(Boolean).length;
}

/** ~165 words per minute, computed — never authored by hand. */
export function readingMinutes(src: string): number {
  return Math.max(1, Math.round(wordCount(src) / 165));
}

/**
 * Truncate *markdown* rather than plain text. Stripping whitespace before
 * rendering collapses headings, lists and code fences into one paragraph —
 * a paywall preview has to look like a real lesson that got cut, not like
 * garbled text. An unterminated code fence is closed so the page can't swallow
 * everything after it.
 */
export function previewMarkdown(src: string, limit = 1200): string {
  if (src.length <= limit) return renderMarkdown(src);

  let cut = src.slice(0, limit);
  const lastBreak = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '));
  if (lastBreak > limit * 0.55) cut = cut.slice(0, lastBreak + 1);

  const fences = (cut.match(/```/g) ?? []).length;
  if (fences % 2 === 1) cut += '\n```';

  return renderMarkdown(cut);
}
