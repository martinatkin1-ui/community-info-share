"use client";

import type { EventCategory } from "@/types/events";

const CATEGORIES: Array<{ label: EventCategory; emoji: string; colour: string }> = [
  { label: "Recovery",      emoji: "🌱", colour: "bg-brand-lime    text-emerald-800 border-emerald-300" },
  { label: "Mental Health", emoji: "💜", colour: "bg-brand-violet   text-violet-900  border-violet-300" },
  { label: "Housing",       emoji: "🏠", colour: "bg-brand-sky      text-sky-900     border-sky-300"    },
  { label: "Social",        emoji: "☕", colour: "bg-brand-amber    text-amber-900   border-amber-300"  },
  { label: "Employment",    emoji: "💼", colour: "bg-brand-blush    text-rose-900    border-rose-300"   },
  { label: "Family",        emoji: "🤝", colour: "bg-brand-coral/20 text-red-900     border-red-200"    },
];

interface Props {
  active: EventCategory[];
  onToggle: (cat: EventCategory) => void;
}

export default function CategoryTags({ active, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {CATEGORIES.map(({ label, emoji, colour }) => {
        const isActive = active.includes(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            aria-pressed={isActive}
            className={`
              flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium
              transition-all duration-150 select-none
              ${colour}
              ${isActive
                ? "ring-2 ring-offset-1 ring-brand-slate shadow-sm scale-105"
                : "opacity-80 hover:opacity-100 hover:scale-105"}
            `}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
