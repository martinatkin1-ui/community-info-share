import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HeroImage = {
  url: string;
  alt: string;
  source: "unsplash-api" | "curated-local";
  photographer?: string;
  link?: string;
};

const CURATED_LOCAL_IMAGES: HeroImage[] = [
  {
    url: "/images/local-area/birmingham-canal.jpg",
    alt: "Birmingham canal scene with wide sky and waterfront space",
    source: "curated-local",
  },
  {
    url: "/images/local-area/library-of-birmingham.jpg",
    alt: "Library of Birmingham modern architecture against open sky",
    source: "curated-local",
  },
  {
    url: "/images/local-area/ironbridge.jpg",
    alt: "The Iron Bridge over the River Severn in Shropshire",
    source: "curated-local",
  },
  {
    url: "/images/local-area/coventry-cathedral.jpg",
    alt: "Coventry Cathedral ruins under a broad cloudy sky",
    source: "curated-local",
  },
  {
    url: "/images/local-area/birmingham-canal-regeneration.jpg",
    alt: "Birmingham canal cityscape with modern regeneration and reflections",
    source: "curated-local",
  },
];

function curatedImage(query: string): HeroImage {
  const q = query.toLowerCase();
  if (q.includes("library")) return CURATED_LOCAL_IMAGES[1];
  if (q.includes("iron") || q.includes("bridge")) return CURATED_LOCAL_IMAGES[2];
  if (q.includes("coventry") || q.includes("cathedral")) return CURATED_LOCAL_IMAGES[3];
  if (q.includes("canal")) return CURATED_LOCAL_IMAGES[0];
  return CURATED_LOCAL_IMAGES[Math.floor(Math.random() * CURATED_LOCAL_IMAGES.length)];
}

export async function GET(request: Request) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  const provider = (process.env.HERO_IMAGE_PROVIDER ?? "curated").toLowerCase();
  const url = new URL(request.url);
  const query = (url.searchParams.get("query") ?? "Birmingham UK architecture")
    .trim()
    .slice(0, 120);

  // Default behavior is curated local imagery to guarantee local relevance.
  if (provider !== "unsplash") {
    return NextResponse.json(curatedImage(query));
  }

  if (!accessKey) {
    return NextResponse.json(curatedImage(query));
  }

  try {
    const apiUrl = new URL("https://api.unsplash.com/photos/random");
    apiUrl.searchParams.set("query", query);
    apiUrl.searchParams.set("orientation", "landscape");
    apiUrl.searchParams.set("content_filter", "high");

    const res = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(curatedImage(query));
    }

    const data = (await res.json()) as {
      urls?: { regular?: string; full?: string };
      alt_description?: string | null;
      user?: { name?: string; links?: { html?: string } };
    };

    const imageUrl = data.urls?.full ?? data.urls?.regular;
    if (!imageUrl) {
      return NextResponse.json(curatedImage(query));
    }

    return NextResponse.json({
      url: imageUrl,
      alt: data.alt_description ?? "West Midlands city and community landscape",
      source: "unsplash-api",
      photographer: data.user?.name,
      link: data.user?.links?.html,
    } satisfies HeroImage);
  } catch {
    return NextResponse.json(curatedImage(query));
  }
}
