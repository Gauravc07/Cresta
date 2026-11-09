import { Fragment } from 'react';

/*
 * Small Markdown renderer for articles. It builds React elements and never injects raw HTML,
 * so article text cannot run scripts.
 * Supports: ## and ### headings, paragraphs, **bold**, *italic*, [links](url), ![images](src),
 * "- " lists, "1. " lists and "> " quotes.
 */
const safeHref = (url) => (/^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(url) ? url : null);
const safeSrc = (url) => (/^\/(img|media|brand)\//.test(url) ? url : null);

function inline(text, keyBase = 'i') {
  const out = [];
  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m;
  let n = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1]) out.push(<strong key={key}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key}>{m[4]}</em>);
    else {
      const href = safeHref(m[7]);
      if (!href) out.push(m[6]);
      else if (/^https?:/i.test(href)) out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{m[6]}</a>);
      else out.push(<a key={key} href={href}>{m[6]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source = '' }) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (!line.trim()) { i += 1; }
    else if (line.startsWith('### ')) { blocks.push(<h3 key={key}>{inline(line.slice(4), key)}</h3>); i += 1; }
    else if (line.startsWith('## ')) { blocks.push(<h2 key={key}>{inline(line.slice(3), key)}</h2>); i += 1; }
    else if (image) {
      const src = safeSrc(image[2]);
      if (src) blocks.push(<img key={key} src={src} alt={image[1]} loading="lazy" decoding="async" />);
      i += 1;
    } else if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i += 1; }
      blocks.push(<ul key={key}>{items.map((t, n) => <li key={n}>{inline(t, `${key}-${n}`)}</li>)}</ul>);
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i += 1; }
      blocks.push(<ol key={key}>{items.map((t, n) => <li key={n}>{inline(t, `${key}-${n}`)}</li>)}</ol>);
    } else if (line.startsWith('> ')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('> ')) { quote.push(lines[i].slice(2)); i += 1; }
      blocks.push(<blockquote key={key}>{inline(quote.join(' '), key)}</blockquote>);
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3} |[-*] |\d+\. |> |!\[)/.test(lines[i])) { para.push(lines[i]); i += 1; }
      if (para.length) blocks.push(<p key={key}>{inline(para.join(' '), key)}</p>);
      else i += 1;
    }
  }
  return <Fragment>{blocks}</Fragment>;
}
