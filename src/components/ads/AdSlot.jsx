"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Google AdSense slot.
 *
 * Env vars used:
 * - NEXT_PUBLIC_ADSENSE_ID (already loaded in root layout)
 * - NEXT_PUBLIC_ADSENSE_TEST_MODE = 'true' (optional)
 *
 * Usage:
 * <AdSlot slot="1234567890" format="auto" responsive />
 */
export default function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
  layout,
  layoutKey,
  fullWidthResponsive,
}) {
  const ref = useRef(null);

  const client = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const testMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === "true";

  const attrs = useMemo(() => {
    const a = {
      "data-ad-client": client,
      "data-ad-slot": slot,
      "data-ad-format": format,
    };
    if (responsive) a["data-full-width-responsive"] = "true";
    if (fullWidthResponsive !== undefined)
      a["data-full-width-responsive"] = fullWidthResponsive ? "true" : "false";
    if (layout) a["data-ad-layout"] = layout;
    if (layoutKey) a["data-ad-layout-key"] = layoutKey;
    if (testMode) a["data-adtest"] = "on";
    return a;
  }, [client, slot, format, responsive, layout, layoutKey, testMode, fullWidthResponsive]);

  useEffect(() => {
    // Only attempt to render in the browser AND when configured.
    if (!client || !slot) return;

    // Guard against repeated pushes on route transitions that can throw.
    // Google recommends pushing after the <ins> exists.
    try {
      // eslint-disable-next-line no-undef
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ignore; AdSense can throw if the slot was already filled.
      // This keeps navigation smooth.
    }
  }, [client, slot]);

  // If not configured, keep layout stable with a tasteful placeholder in dev.
  if (!client || !slot) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div
          className={`rounded-2xl border border-dashed border-gray-300 bg-white/40 text-gray-500 text-xs flex items-center justify-center ${className}`}
          style={{ minHeight: 120, ...style }}
        >
          Ad slot placeholder
        </div>
      );
    }
    return null;
  }

  return (
    <div ref={ref} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        {...attrs}
      />
    </div>
  );
}
