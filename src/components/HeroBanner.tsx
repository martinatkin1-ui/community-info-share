import type { ReactNode } from "react";
import Image from "next/image";

type HeroBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePositionClassName?: string;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
};

export default function HeroBanner({
  eyebrow,
  title,
  description,
  imageUrl,
  imagePositionClassName = "bg-center",
  className = "",
  contentClassName = "max-w-2xl",
  children,
}: HeroBannerProps) {
  return (
    <header
      className={`relative overflow-hidden rounded-3xl border border-white/20 px-6 py-10 text-white sm:px-8 ${className}`}
    >
      <Image
        src={imageUrl}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${imagePositionClassName}`}
        priority
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(110deg, rgba(8,20,34,0.62) 0%, rgba(8,20,34,0.34) 45%, rgba(8,20,34,0.1) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[1.5px]" aria-hidden="true" />
      <div className={`relative ${contentClassName}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">{description}</p>
        {children}
      </div>
    </header>
  );
}