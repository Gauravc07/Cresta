/* Renders one page to HTML on the server, so search engines and visitors get real content straight away. */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { SeoContext } from './components/ui.jsx';
import { ContentContext } from './lib/data.js';

export { buildHead, headToHtml, safeJson } from './lib/seo.js';

export function render(url, data) {
  const seo = { meta: null, status: 200 };
  const used = new Set();
  const html = renderToString(
    <ContentContext.Provider value={{ data, used }}>
      <SeoContext.Provider value={seo}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </SeoContext.Provider>
    </ContentContext.Provider>,
  );
  const embedded = Object.fromEntries([...used].map((key) => [key, data[key] ?? null]));
  return { html, meta: seo.meta, status: seo.status, embedded };
}
