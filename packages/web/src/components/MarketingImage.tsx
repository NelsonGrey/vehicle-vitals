export function webpVariant(src: string): string {
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

interface MarketingImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  decoding?: 'sync' | 'async' | 'auto';
}

/**
 * Serves a generated WebP sibling first and keeps the original file as the
 * fallback. Gallery links can still point at the full-size PNG.
 */
export default function MarketingImage({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
  decoding = 'async',
}: MarketingImageProps) {
  return (
    <picture>
      <source srcSet={webpVariant(src)} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        decoding={decoding}
      />
    </picture>
  );
}
