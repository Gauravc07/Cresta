import images from '../data/images.json';

/**
 * Image with intrinsic size (prevents layout shift), lazy loading by default,
 * and a 960px variant on small screens when one exists (`<name>-sm.webp`).
 * Pass priority for above-the-fold images.
 */
export default function Img({ src, alt = '', sizes = '(max-width: 900px) 100vw, 50vw', priority = false, ...rest }) {
  const meta = images[src];
  const srcSet = meta?.sm ? `${src.replace(/\.webp$/, '-sm.webp')} ${meta.sm}w, ${src} ${meta.w}w` : undefined;
  return (
    <img
      src={src}
      alt={alt}
      width={meta?.w}
      height={meta?.h}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
    />
  );
}
