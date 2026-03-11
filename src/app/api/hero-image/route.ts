import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HeroImage = {
  url: string;
  alt: string;
  source: "unsplash-api" | "unsplash-fallback";
  photographer?: string;
  link?: string;
};

const FALLBACK_QUERIES = [
  "birmingham uk canals architecture skyline",
  "library of birmingham modern architecture",
  "coventry cathedral uk cityscape",
  "west midlands urban regeneration",
  "ironbridge uk heritage landscape",
];

function fallbackImage(): HeroImage {
  const query = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
  const sig = Math.floor(Math.random() * 1000);
  return {
    url: `https://source.unsplash.com/2400x1350/?${encodeURIComponent(query)}&sig=${sig}`,
    alt: "West Midlands landmark in wide landscape orientation",
    source: "unsplash-fallback",
  };
}

export async function GET(request: Request) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  const url = new URL(request.url);
  const query = (url.searchParams.get("query") ?? "Birmingham UK architecture")
    .trim()
    .slice(0, 120);

  if (!accessKey) {
    return NextResponse.json(fallbackImage());
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
      return NextResponse.json(fallbackImage());
    }

    const data = (await res.json()) as {
      urls?: { regular?: string; full?: string };
      alt_description?: string | null;
      user?: { name?: string; links?: { html?: string } };
    };

    const imageUrl = data.urls?.full ?? data.urls?.regular;
    if (!imageUrl) {
      return NextResponse.json(fallbackImage());
    }

    return NextResponse.json({
      url: imageUrl,
      alt: data.alt_description ?? "West Midlands city and community landscape",
      source: "unsplash-api",
      photographer: data.user?.name,
      link: data.user?.links?.html,
    } satisfies HeroImage);
  } catch {
    return NextResponse.json(fallbackImage());
  }
}
