"use client";

import Image, { type ImageLoaderProps } from "next/image";
import { useState } from "react";
import s from "../homepage.module.css";

// Let the image CDN supply a real responsive srcset, without downloading the
// same desktop-sized file on every device.
function foodImageLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}

function isLocalImage(src: string) {
  return src.startsWith("/");
}

export default function HomePhoto({ src, alt, sizes, priority = false }: {
  src: string; alt: string; sizes: string; priority?: boolean;
}) {
  const [visible, setVisible] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const renderImage = (imageSrc: string, imageAlt: string, className: string, imageProps: { loading?: "eager"; preload?: boolean; onLoad?: () => void; onError?: () => void } = {}) => {
    const props = { ...imageProps, fill: true, sizes, className };
    return isLocalImage(imageSrc)
      ? <Image src={imageSrc} alt={imageAlt} {...props} />
      : <Image loader={foodImageLoader} src={imageSrc} alt={imageAlt} {...props} />;
  };

  return (
    <>
      <div className={s.photoFallback} aria-hidden="true">
        <Image src="/deepa-chakra.svg" width={90} height={90} alt="" />
      </div>
      {visible && failed !== src ? renderImage(visible, visible === src ? alt : "", s.loadedPhoto, { loading: priority ? "eager" : undefined }) : null}
      {visible !== src && failed !== src ? renderImage(src, "", s.loadingPhoto, {
        preload: priority,
        onLoad: () => setVisible(src),
        onError: () => setFailed(src),
      }) : null}
      {failed === src ? <span className={s.photoError} role="status">Photograph unavailable</span> : null}
    </>
  );
}
