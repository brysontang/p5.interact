// Editable, syntax-highlighted code for the docs and examples: CodeMirror 5 from jsDelivr,
// loaded on demand so the page stubs stay three lines. Falls back to the plain textarea
// if the CDN is unreachable.

const CM = 'https://cdn.jsdelivr.net/npm/codemirror@5.65.19';
let cmReady = null;

function loadCodeMirror() {
  if (cmReady) return cmReady;
  cmReady = new Promise((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = `${CM}/lib/codemirror.min.css`;
    document.head.appendChild(css);
    const s1 = document.createElement('script');
    s1.src = `${CM}/lib/codemirror.min.js`;
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = `${CM}/mode/javascript/javascript.min.js`;
      s2.onload = () => resolve(true);
      s2.onerror = () => resolve(false);
      document.head.appendChild(s2);
    };
    s1.onerror = () => resolve(false);
    document.head.appendChild(s1);
  });
  return cmReady;
}

// Turn a textarea into an editor. onChange fires with the new code (debounced by the caller).
async function makeEditor(ta, onChange) {
  const ok = await loadCodeMirror();
  if (!ok || !window.CodeMirror) {
    ta.addEventListener('input', () => onChange(ta.value));
    return { getValue: () => ta.value };
  }
  const cm = CodeMirror.fromTextArea(ta, {
    mode: 'javascript',
    lineNumbers: false,
    lineWrapping: false,
    viewportMargin: Infinity,   // render every line, so the editor is exactly as tall as the code
    indentUnit: 2,
    tabSize: 2,
    extraKeys: { Tab: (cm) => cm.replaceSelection('  ') },
  });
  cm.on('change', () => onChange(cm.getValue()));
  return cm;
}
