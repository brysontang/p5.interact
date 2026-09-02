// A small markdown renderer: enough for the README and example descriptions.
// Headings, paragraphs, fenced code, inline code, bold, links, bullet lists, pipe tables.

function renderMarkdown(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const out = [];
  const lines = md.replace(/\r/g, '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {                                   // fenced code
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre class="block"><code>${esc(buf.join('\n'))}</code></pre>`);
    } else if (/^#{1,3}\s/.test(line)) {                        // headings
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${inline(line.replace(/^#+\s*/, ''))}</h${level}>`);
      i++;
    } else if (/^\|/.test(line)) {                              // pipe table
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    } else if (/^[-*]\s/.test(line)) {                          // bullet list
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        let item = lines[i++].replace(/^[-*]\s/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^[-*]\s/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`);
    } else if (line.trim() === '') {
      i++;
    } else {                                                    // paragraph
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(```|#{1,3}\s|\||[-*]\s)/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}
