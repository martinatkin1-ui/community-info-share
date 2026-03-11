"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export default function SearchBar({ value, onChange, placeholder, "aria-label": ariaLabel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" shortcut focuses the search bar
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      {/* search icon */}
      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search events, organisations…"}
        aria-label={ariaLabel ?? "Search events"}
        className="
          w-full rounded-2xl border border-neutral-200 bg-white
          py-3 pl-11 pr-14
          text-base text-brand-slate placeholder:text-neutral-400
          shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-coral/60
          transition-shadow
        "
      />

      {/* shortcut hint */}
      {!value && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-400 font-mono">
            /
          </kbd>
        </span>
      )}

      {/* clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute inset-y-0 right-4 flex items-center text-neutral-400 hover:text-neutral-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
