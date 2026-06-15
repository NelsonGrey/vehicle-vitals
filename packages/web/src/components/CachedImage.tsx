import React from 'react';
import { Img } from 'react-image';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  loader?: React.ReactElement;
  unloader?: React.ReactElement;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  style,
  loader,
  unloader,
}) => {
  const defaultLoader = (
    <div
      className={`bg-gray-200 flex items-center justify-center ${className || ''}`}
      style={{ width, height, ...style }}
    >
      <svg
        className="w-6 h-6 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

  const defaultUnloader = (
    <div
      className={`bg-gray-200 flex items-center justify-center ${className || ''}`}
      style={{ width, height, ...style }}
    >
      <svg
        className="w-6 h-6 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );

  return (
    <Img
      src={src}
      alt={alt}
      className={className}
      style={{ width, height, ...style }}
      loader={loader || defaultLoader}
      unloader={unloader || defaultUnloader}
      loading="lazy"
    />
  );
};
