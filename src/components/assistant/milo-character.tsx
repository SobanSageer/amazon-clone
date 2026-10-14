"use client";

// Milo, drawn as inline SVG so he can animate and inherit Marlo's tokens.
// Motion lives in CSS keyframes and is disabled under prefers-reduced-motion.
export function MiloCharacter({ listening = false }: { listening?: boolean }) {
  return (
    <>
      <svg viewBox="0 0 64 64" className="milo size-full" role="img" aria-label="Milo, the Marlo shopping assistant">
        <g className="milo-body">
          {/* shopping-bag body */}
          <path
            d="M14 22h36a3 3 0 0 1 3 3.2l-2.4 27A6 6 0 0 1 44.6 58H19.4a6 6 0 0 1-6-5.8l-2.4-27A3 3 0 0 1 14 22Z"
            fill="var(--color-m-accent)"
          />
          {/* handle */}
          <path
            d="M23 23v-6a9 9 0 0 1 18 0v6"
            fill="none"
            stroke="var(--color-m-accent)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          {/* face plate */}
          <rect x="18" y="29" width="28" height="19" rx="8" fill="#fff" opacity="0.96" />
          <g className="milo-eyes" fill="var(--color-m-ink)">
            <circle cx="27" cy="37" r="2.6" />
            <circle cx="37" cy="37" r="2.6" />
          </g>
          <path
            d="M28 43.5c1.2 1.4 2.5 2.1 4 2.1s2.8-.7 4-2.1"
            fill="none"
            stroke="var(--color-m-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* cheeks */}
          <circle cx="22.5" cy="42" r="1.8" fill="var(--color-m-accent)" opacity="0.25" />
          <circle cx="41.5" cy="42" r="1.8" fill="var(--color-m-accent)" opacity="0.25" />
        </g>
        {listening && (
          <g className="milo-dots" fill="var(--color-m-accent)">
            <circle cx="27" cy="37" r="1.6" />
            <circle cx="32" cy="37" r="1.6" />
            <circle cx="37" cy="37" r="1.6" />
          </g>
        )}
      </svg>

    </>
  );
}
