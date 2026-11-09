import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SeoContext, usePageMeta } from '../components/ui.jsx';

export default function NotFound() {
  usePageMeta('Page not found | Cresta', 'This page could not be found. Browse Cresta FRP swimming pools, pool pumps and pool equipment, or contact our team.', { noindex: true });
  // Sends a real 404 status, so search engines do not treat missing pages as soft 404s.
  const seo = useContext(SeoContext);
  if (seo) seo.status = 404;
  return (
    <section className="section notfound">
      <div className="container stack">
        <p className="eyebrow u-center">404</p>
        <h1 className="h2">This page has drained away.</h1>
        <p className="lead">The page you're looking for doesn't exist or has moved.</p>
        <div className="btn-row u-center">
          <Link className="btn btn-primary" to="/">Back to home</Link>
          <Link className="btn btn-ghost" to="/products">Browse products</Link>
        </div>
      </div>
    </section>
  );
}
