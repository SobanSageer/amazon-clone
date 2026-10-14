"use client";

// Milo: a small mascot drawn as inline SVG so he can animate and inherit Marlo's tokens.
// Motion lives in globals.css keyframes and is disabled under prefers-reduced-motion.
export function MiloCharacter({ listening = false }: { listening?: boolean }) {
  return (
    <svg viewBox="0 0 64 72" className="milo size-full overflow-visible" role="img" aria-label="Milo, the Marlo shopping assistant">
      <ellipse cx="32" cy="68" rx="15" ry="2.6" fill="var(--color-m-ink)" opacity="0.12" />

      <g className="milo-float">
        {/* antenna */}
        <path d="M32 15V9" stroke="var(--color-m-accent)" strokeWidth="2.2" strokeLinecap="round" />
        <circle className="milo-antenna" cx="32" cy="6.5" r="3.2" fill="var(--color-m-accent)" />

        {/* legs + feet */}
        <path d="M26 56v4M38 56v4" stroke="var(--color-m-accent)" strokeWidth="3.4" strokeLinecap="round" />
        <ellipse className="milo-foot-l" cx="25" cy="62" rx="5.2" ry="3.1" fill="var(--color-m-accent)" />
        <ellipse className="milo-foot-r" cx="39" cy="62" rx="5.2" ry="3.1" fill="var(--color-m-accent)" />

        {/* body */}
        <rect x="21" y="41" width="22" height="16" rx="7.5" fill="var(--color-m-accent)" />

        {/* left arm, resting */}
        <g className="milo-arm-left">
          <path d="M22 46c-4 1.5-6.5 3.5-7.5 6" stroke="var(--color-m-accent)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <circle cx="13.6" cy="53.4" r="3.4" fill="var(--color-m-accent)" />
        </g>

        {/* right arm, waving hello */}
        <g className="milo-arm-right">
          <path d="M42 45c4-1 7-3.5 8.5-6.5" stroke="var(--color-m-accent)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <circle cx="51.6" cy="37" r="3.6" fill="var(--color-m-accent)" />
        </g>

        {/* head */}
        <rect x="13" y="14" width="38" height="29" rx="12.5" fill="var(--color-m-accent)" />
        <rect x="17.5" y="19" width="29" height="19" rx="9.5" fill="#fff" opacity="0.97" />

        {listening ? (
          <g className="milo-dots" fill="var(--color-m-accent)">
            <circle cx="26" cy="28.5" r="2" />
            <circle cx="32" cy="28.5" r="2" />
            <circle cx="38" cy="28.5" r="2" />
          </g>
        ) : (
          <>
            <g className="milo-eyes" fill="var(--color-m-ink)">
              <circle cx="27" cy="27" r="2.7" />
              <circle cx="37" cy="27" r="2.7" />
            </g>
            <path
              d="M28 32.4c1.2 1.5 2.5 2.2 4 2.2s2.8-.7 4-2.2"
              fill="none"
              stroke="var(--color-m-ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="21.8" cy="31.5" r="1.9" fill="var(--color-m-accent)" opacity="0.28" />
            <circle cx="42.2" cy="31.5" r="1.9" fill="var(--color-m-accent)" opacity="0.28" />
          </>
        )}
      </g>
    </svg>
  );
}
