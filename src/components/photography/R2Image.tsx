import type { Photo } from "@/lib/r2/types";
import { getPhotoSrcSet } from "@/lib/r2/photos";

interface Props {
  photo: Pick<Photo, "r2Key" | "updatedAt" | "width">;
  alt: string;
  /** Same semantics as the `sizes` attribute / next/image's `sizes` prop. */
  sizes: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Above-the-fold image: eager-load, high fetch priority. */
  priority?: boolean;
  draggable?: boolean;
  onLoad?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

/**
 * Renders a photo from its pre-generated WebP derivatives (see
 * `src/lib/r2/variants.ts`), served directly from R2 — not through Vercel's
 * paid Image Optimization API. Positions itself like `next/image`'s `fill`
 * (absolutely filling its nearest positioned ancestor); pass sizing/fit
 * classes (e.g. `object-cover`) via `className`.
 */
export function R2Image({
  photo,
  alt,
  sizes,
  className,
  loading = "lazy",
  priority = false,
  draggable,
  onLoad,
  onContextMenu,
}: Props) {
  const { src, srcSet } = getPhotoSrcSet(photo);

  return (
    // Intentional: srcSet points at our own pre-generated R2 derivatives,
    // bypassing next/image's paid optimizer by design (see module doc above).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      draggable={draggable}
      onLoad={onLoad}
      onContextMenu={onContextMenu}
      className={`absolute inset-0 w-full h-full${className ? ` ${className}` : ""}`}
    />
  );
}
