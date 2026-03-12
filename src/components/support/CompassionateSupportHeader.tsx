import Image from "next/image";

interface CompassionateSupportHeaderProps {
  title: string;
  overview: string;
  imageUrl: string;
  ctaLabel: string;
}

export default function CompassionateSupportHeader({
  title,
  overview,
  imageUrl,
  ctaLabel,
}: CompassionateSupportHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/30 text-white">
      <Image
        src={imageUrl}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        priority
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20"
        aria-hidden="true"
      />
      <div className="relative px-6 py-10 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Specialist Support Route
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/95">{overview}</p>
        <p className="mt-4 inline-flex rounded-full bg-white/20 px-4 py-2 text-base font-semibold">
          {ctaLabel}
        </p>
      </div>
    </header>
  );
}
