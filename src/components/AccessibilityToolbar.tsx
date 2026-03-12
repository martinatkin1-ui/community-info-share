"use client";

import { useEffect, useState } from "react";

const KEY_SIMPLIFIED = "wm_simplified_mode";
const KEY_MASK = "wm_reading_mask";

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [simplified, setSimplified] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_SIMPLIFIED) === "1";
  });
  const [mask, setMask] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_MASK) === "1";
  });

  useEffect(() => {
    document.body.classList.toggle("simplified-mode", simplified);
    localStorage.setItem(KEY_SIMPLIFIED, simplified ? "1" : "0");
  }, [simplified]);

  useEffect(() => {
    document.body.classList.toggle("reading-mask-enabled", mask);
    localStorage.setItem(KEY_MASK, mask ? "1" : "0");
  }, [mask]);

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-[70] rounded-full border border-white/40 bg-white/90 px-4 py-2 text-sm font-semibold text-wm-slate shadow-wm-soft backdrop-blur sm:bottom-6 sm:right-6"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        Accessibility
      </button>

      {open ? (
        <aside
          id="a11y-panel"
          className="wm-glass fixed bottom-20 right-4 z-[70] w-[calc(100vw-2rem)] max-w-xs rounded-2xl p-4 sm:bottom-24 sm:right-6"
          aria-label="Accessibility controls"
        >
          <h2 className="text-sm font-semibold text-wm-slate">Reading support</h2>
          <p className="mt-1 text-xs text-neutral-600">Controls for lower-stimulation reading and reduced visual noise.</p>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => setSimplified((v) => !v)}
              className="wm-btn-muted w-full justify-between"
              aria-pressed={simplified}
            >
              <span>Simplified mode</span>
              <span>{simplified ? "On" : "Off"}</span>
            </button>

            <button
              type="button"
              onClick={() => setMask((v) => !v)}
              className="wm-btn-muted w-full justify-between"
              aria-pressed={mask}
            >
              <span>Reading mask</span>
              <span>{mask ? "On" : "Off"}</span>
            </button>
          </div>
        </aside>
      ) : null}

      {mask ? <div className="reading-mask-overlay" aria-hidden="true" /> : null}
    </>
  );
}
