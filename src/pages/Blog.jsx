import { Link, useParams } from 'react-router-dom';
import Img from '../components/Img.jsx';
import { CtaBand, PageHero, usePageMeta } from '../components/ui.jsx';
import { useBlogPost, useBlogs } from '../lib/data.js';
import { Markdown } from '../lib/markdown.jsx';
import NotFound from './NotFound.jsx';

const dateLabel = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '');

export function BlogList() {
  const posts = useBlogs();
  usePageMeta('Swimming Pool Guides & FRP Pool Advice | Cresta Blog',
    'Practical guides from Cresta on choosing FRP swimming pools, comparing RCC and fibreglass, sizing pumps and filters, and keeping your pool water clear all year.',
    { crumbs: [['Blog', '/blog']], noindex: !posts.length });

  return (
    <>
      <PageHero compact image="/img/site/water.webp" alt="Sunlight rippling across clear blue pool water" crumb="Blog"
        title="Pool guides and advice."
        sub="Straight answers on choosing, equipping and looking after a swimming pool." />
      <section className="section">
        <div className="container">
          {posts.length ? (
            <div className="post-grid">
              {posts.map((p) => (
                <article className="post-card" key={p.id}>
                  <Link to={`/blog/${p.slug}`} className="post-card-media" tabIndex={-1} aria-hidden="true">
                    {p.image_path && <Img src={p.image_path} alt="" sizes="(max-width: 860px) 100vw, 33vw" />}
                  </Link>
                  {p.category && <p className="eyebrow">{p.category}</p>}
                  <h2 className="h3"><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
                  {p.excerpt && <p>{p.excerpt}</p>}
                  <time dateTime={p.published_at}>{dateLabel(p.published_at)}</time>
                </article>
              ))}
            </div>
          ) : <p className="lead">New articles are on the way. In the meantime, <Link to="/contact">ask our team</Link> anything about your pool.</p>}
        </div>
      </section>
    </>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const post = useBlogPost(slug);

  usePageMeta(
    post ? (post.meta_title || `${post.title} | Cresta`) : 'Cresta Blog',
    post ? (post.meta_description || post.excerpt) : undefined,
    post ? {
      type: 'article',
      image: post.image_path || undefined,
      crumbs: [['Blog', '/blog'], [post.title, `/blog/${post.slug}`]],
      jsonLd: (base, abs) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.meta_description || post.excerpt || undefined,
        image: post.image_path ? abs(post.image_path) : undefined,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: { '@id': `${base}/#organization` },
        publisher: { '@id': `${base}/#organization` },
        mainEntityOfPage: abs(`/blog/${post.slug}`),
      }),
    } : { noindex: true },
  );

  if (post === null) return <NotFound />;
  if (post === undefined) return <section className="section"><div className="container"><p className="lead">Loading…</p></div></section>;

  return (
    <>
      <article className="article">
        <header className="article-head">
          <div className="container container--narrow">
            <ol className="crumbs" aria-label="Breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li aria-current="page">{post.category || 'Article'}</li>
            </ol>
            <h1 className="h1">{post.title}</h1>
            <time dateTime={post.published_at}>{dateLabel(post.published_at)}</time>
          </div>
        </header>
        {post.image_path && (
          <div className="container container--narrow article-media">
            <Img src={post.image_path} alt={post.image_alt || ''} priority sizes="(max-width: 860px) 100vw, 860px" />
          </div>
        )}
        <div className="container container--narrow article-body">
          <Markdown source={post.content} />
        </div>
      </article>
      <CtaBand eyebrow="Planning a pool?" title="Talk to our engineers."
        text="Share your site details and we'll recommend a pool, equipment package and next steps.">
        <Link className="btn btn-primary" to="/contact">Request a quote</Link>
        <Link className="btn btn-ghost" to="/blog">More articles</Link>
      </CtaBand>
    </>
  );
}
