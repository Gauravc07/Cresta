import { Link, useParams } from 'react-router-dom';
import Img from '../components/Img.jsx';
import { CtaBand, PageHero, usePageMeta } from '../components/ui.jsx';
import { useProject, useProjects } from '../lib/data.js';
import { Markdown } from '../lib/markdown.jsx';
import NotFound from './NotFound.jsx';

export function ProjectList() {
  const projects = useProjects();
  usePageMeta('FRP Pool & Pool Equipment Projects in India | Cresta',
    'See Cresta FRP swimming pool and pool equipment projects across India, with photos, locations and details from villas, resorts, clubs and commercial pool sites.',
    { crumbs: [['Projects', '/projects']], noindex: !projects.length });

  return (
    <>
      <PageHero compact image="/img/site/construction.webp" alt="Aerial view of a club pool and lawns surrounded by trees" crumb="Projects"
        title="Our projects." sub="Pools and plant rooms delivered by the Cresta team." />
      <section className="section">
        <div className="container">
          {projects.length ? (
            <div className="post-grid">
              {projects.map((p) => (
                <article className="post-card" key={p.id}>
                  <Link to={`/projects/${p.slug}`} className="post-card-media" tabIndex={-1} aria-hidden="true">
                    {p.images[0] && <Img src={p.images[0].src} alt="" sizes="(max-width: 860px) 100vw, 33vw" />}
                  </Link>
                  {p.location && <p className="eyebrow">{p.location}</p>}
                  <h2 className="h3"><Link to={`/projects/${p.slug}`}>{p.name}</Link></h2>
                </article>
              ))}
            </div>
          ) : <p className="lead">Project stories are coming soon. <Link to="/contact">Ask our team</Link> for references near you.</p>}
        </div>
      </section>
    </>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const project = useProject(slug);
  const summary = project?.description?.replace(/[#*>[\]()!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 158);

  usePageMeta(
    project ? `${project.name}${project.location ? `, ${project.location}` : ''} | Cresta` : 'Cresta Projects',
    summary || (project ? `${project.name}: a Cresta pool project${project.location ? ` in ${project.location}` : ''}.` : undefined),
    project ? {
      image: project.images[0]?.src,
      crumbs: [['Projects', '/projects'], [project.name, `/projects/${project.slug}`]],
    } : { noindex: true },
  );

  if (project === null) return <NotFound />;
  if (project === undefined) return <section className="section"><div className="container"><p className="lead">Loading…</p></div></section>;

  return (
    <>
      <article className="article">
        <header className="article-head">
          <div className="container container--narrow">
            <ol className="crumbs" aria-label="Breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li aria-current="page">{project.name}</li>
            </ol>
            <h1 className="h1">{project.name}</h1>
            {project.location && <p className="eyebrow">{project.location}</p>}
          </div>
        </header>
        <div className="container container--narrow article-body">
          <Markdown source={project.description ?? ''} />
        </div>
        {project.images.length > 0 && (
          <div className="container gallery">
            {project.images.map((img) => (
              <Img key={img.src} src={img.src} alt={img.alt || `${project.name}${project.location ? `, ${project.location}` : ''}`} sizes="(max-width: 860px) 100vw, 50vw" />
            ))}
          </div>
        )}
      </article>
      <CtaBand eyebrow="Your project next" title="Tell us about your site."
        text="Share your location and pool size, and we'll recommend a model and equipment package.">
        <Link className="btn btn-primary" to="/contact">Request a quote</Link>
        <Link className="btn btn-ghost" to="/projects">All projects</Link>
      </CtaBand>
    </>
  );
}
