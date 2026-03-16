"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface NewsPost {
  id: string;
  source: string;
  sourceUrl: string | null;
  title: string | null;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  organization: { id: string; name: string } | null;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  manual: { label: "Update", color: "bg-neutral-100 text-neutral-700" },
  facebook: { label: "Facebook", color: "bg-blue-100 text-blue-800" },
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-800" },
  x: { label: "X", color: "bg-neutral-900 text-white" },
  rss: { label: "RSS", color: "bg-orange-100 text-orange-800" },
  website: { label: "Website", color: "bg-sky-100 text-sky-800" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (before?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (before) params.set("before", before);
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load news.");
      const newPosts: NewsPost[] = data.posts ?? [];
      setPosts((prev) => (before ? [...prev, ...newPosts] : newPosts));
      setHasMore(newPosts.length >= 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const lastDate = posts.length > 0 ? posts[posts.length - 1].publishedAt : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-brand-slate">Community News</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Latest updates from local organisations across the West Midlands.
        </p>
      </header>

      {error && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-4">
        {posts.map((post) => {
          const src = SOURCE_LABELS[post.source] ?? SOURCE_LABELS.manual;
          return (
            <article
              key={post.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-brand-sky/30"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${src.color}`}>
                  {src.label}
                </span>
                {post.organization && (
                  <Link
                    href={`/organizations/${post.organization.id}`}
                    className="font-medium text-neutral-700 hover:underline"
                  >
                    {post.organization.name}
                  </Link>
                )}
                <span className="ml-auto text-neutral-400">{timeAgo(post.publishedAt)}</span>
              </div>

              {post.title && (
                <h2 className="mt-2 text-base font-semibold text-neutral-900">{post.title}</h2>
              )}

              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700 line-clamp-6">
                {post.body}
              </p>

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="mt-3 max-h-64 w-full rounded-xl object-cover"
                  loading="lazy"
                />
              )}

              {post.sourceUrl && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-brand-sky hover:underline"
                >
                  View original post &rarr;
                </a>
              )}
            </article>
          );
        })}

        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">No community news yet. Check back soon.</p>
          </div>
        )}
      </div>

      {loading && (
        <p className="mt-6 text-center text-sm text-neutral-500">Loading...</p>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => loadPosts(lastDate)}
            className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Load more
          </button>
        </div>
      )}
    </main>
  );
}
