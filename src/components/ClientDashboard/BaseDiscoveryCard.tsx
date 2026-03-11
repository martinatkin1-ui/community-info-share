"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { ReactNode } from "react";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMzIwJyBoZWlnaHQ9JzE4MCcgdmlld0JveD0nMCAwIDMyMCAxODAnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSdnJyB4MT0nMCcgeTE9JzAnIHgyPScxJyB5Mj0nMSc+PHN0b3Agb2Zmc2V0PScwJScgc3RvcC1jb2xvcj0nI2Y4ZWY2ZicvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nI2U5ZjJmYicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSczMjAnIGhlaWdodD0nMTgwJyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+";

function flierLoader({ src, width, quality }: ImageLoaderProps) {
  const separator = src.includes("?") ? "&" : "?";
  // Request a compressed size variant first for low-bandwidth devices.
  return `${src}${separator}w=${width}&q=${quality ?? 45}`;
}

interface BaseDiscoveryCardProps {
  imageUrl?: string | null;
  imageAlt: string;
  fallbackBanner?: ReactNode;
  badges?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  lowData?: boolean;
}

export default function BaseDiscoveryCard({
  imageUrl,
  imageAlt,
  fallbackBanner,
  badges,
  title,
  subtitle,
  body,
  footer,
  lowData = false,
}: BaseDiscoveryCardProps) {
  return (
    <article
      className={`break-inside-avoid mb-4 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm ${
        !lowData ? "transition-transform duration-200 hover:-translate-y-1 hover:shadow-md" : ""
      }`}
    >
      {!lowData &&
        (imageUrl ? (
          <div className="relative h-36 w-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              loader={flierLoader}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-28">{fallbackBanner}</div>
        ))}

      <div className="space-y-2 p-4">
        {badges}
        <h3 className="line-clamp-2 leading-snug font-semibold text-brand-slate">{title}</h3>
        {subtitle}
        {body}
        {footer}
      </div>
    </article>
  );
}
