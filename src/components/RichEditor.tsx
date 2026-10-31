'use client';

import { useEffect, useRef } from 'react';

/**
 * Minimal WYSIWYG: a contenteditable surface plus execCommand for the handful of
 * formats an article actually needs, with a hidden input carrying the HTML to the
 * server action. Deliberately dependency-free — a 300KB editor for eight buttons
 * is not a trade worth making here.
 *
 * The server sanitises whatever arrives (sanitizeHtml in lib/markdown.ts), so
 * nothing from this component is trusted.
 */
export function RichEditor({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  function sync() {
    if (input.current && ref.current) input.current.value = ref.current.innerHTML;
  }

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== defaultValue) {
      ref.current.innerHTML = defaultValue;
    }
    sync();
    // run once: the editor owns its DOM afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function run(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  return (
    <div className="editor">
      <label className="editor-label">{label}</label>
      <div className="editor-bar" role="toolbar" aria-label="עיצוב טקסט">
        <button type="button" onClick={() => run('bold')} aria-label="מודגש"><b>B</b></button>
        <button type="button" onClick={() => run('italic')} aria-label="נטוי"><i>I</i></button>
        <button type="button" onClick={() => run('formatBlock', 'h2')}>כותרת</button>
        <button type="button" onClick={() => run('formatBlock', 'p')}>פסקה</button>
        <button type="button" onClick={() => run('insertUnorderedList')}>רשימה</button>
        <button type="button" onClick={() => run('insertOrderedList')}>ממוספרת</button>
        <button type="button" onClick={() => run('formatBlock', 'blockquote')}>ציטוט</button>
        <button
          type="button"
          onClick={() => {
            const href = window.prompt('קישור (https://...)');
            if (href) run('createLink', href);
          }}
        >
          קישור
        </button>
        <button type="button" onClick={() => run('removeFormat')}>ניקוי</button>
      </div>
      <div
        ref={ref}
        className="editor-surface prose"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        dir="rtl"
        onInput={sync}
        onBlur={sync}
      />
      <input ref={input} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
