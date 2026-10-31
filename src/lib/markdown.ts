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

/* ---- rich text from the studio editor: allowlist, never raw pass-through ---- */

const ALLOWED_TAGS = new Set([
  'p','br','strong','b','em','i','u','s','h2','h3','h4','blockquote',
  'ul','ol','li','code','pre','a','hr','div','span',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title']),
  div: new Set(['data-align']),
  span: new Set(['data-mark']),
};

function safeHref(raw: string): string | null {
  const v = raw.trim();
  if (/^(https?:\/\/|\/|mailto:)/i.test(v) && !/^\s*javascript:/i.test(v)) return v;
  return null;
}

/**
 * Tokenise the editor HTML and rebuild it from an allowlist. Unknown tags are
 * dropped (their text is kept), attributes are dropped unless whitelisted, and
 * link targets must be http(s), mailto or site-relative.
 */
export function sanitizeHtml(src: string): string {
  const out: string[] = [];
  const re = /<\/?([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const [whole, rawName, rawAttrs, text] = m;
    if (text !== undefined) {
      out.push(escapeHtml(text));
      continue;
    }
    const name = (rawName || '').toLowerCase();
    if (!ALLOWED_TAGS.has(name)) continue;

    if (whole.startsWith('</')) {
      if (!['br', 'hr'].includes(name)) out.push(`</${name}>`);
      continue;
    }

    const allowed = ALLOWED_ATTRS[name] ?? new Set<string>();
    const parts: string[] = [];
    const attrRe = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(rawAttrs || '')) !== null) {
      const key = a[1].toLowerCase();
      const value = a[3] ?? a[4] ?? '';
      if (!allowed.has(key)) continue;
      if (key === 'href') {
        const href = safeHref(value);
        if (!href) continue;
        parts.push(`href="${escapeHtml(href)}" rel="noopener"`);
      } else if (key === 'title') {
        parts.push(`title="${escapeHtml(value)}"`);
      } else if (key === 'data-align' && /^(start|center|end)$/.test(value)) {
        parts.push(`data-align="${value}"`);
      } else if (key === 'data-mark' && /^[a-z-]{1,20}$/.test(value)) {
        parts.push(`data-mark="${value}"`);
      }
    }
    out.push(`<${name}${parts.length ? ' ' + parts.join(' ') : ''}>`);
  }
  return out.join('');
}

/** Bodies come from two places: markdown seed files and the studio editor. */
export function renderRich(src: string): string {
  return /^\s*</.test(src) ? sanitizeHtml(src) : renderMarkdown(src);
}

/** Preview text for a paywall/teaser: strip tags, then cut on a sentence. */
export function previewRich(src: string, limit = 1200): string {
  if (/^\s*</.test(src)) {
    const text = sanitizeHtml(src)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= limit) return `<p>${escapeHtml(text)}</p>`;
    const cut = text.slice(0, limit);
    const stop = cut.lastIndexOf('. ');
    return `<p>${escapeHtml((stop > limit * 0.6 ? cut.slice(0, stop + 1) : cut).trim())}…</p>`;
  }
  return previewMarkdown(src, limit);
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
