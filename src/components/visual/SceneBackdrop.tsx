import type { ReactNode } from "react";

type SceneVariant = "page" | "hero" | "flow" | "circles" | "wash" | "cta";

function Dots({ id, x, y, cols, rows }: { id: string; x: number; y: number; cols: number; rows: number }) {
  return (
    <g className="scene-backdrop__dots">
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => (
          <circle
            key={`${id}-${row}-${col}`}
            cx={x + col * 14}
            cy={y + row * 14}
            r="1.6"
            fill="#006EF9"
            opacity={0.28}
          />
        )),
      )}
    </g>
  );
}

function HeroScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ellipse className="scene-backdrop__drift-a" cx="1280" cy="80" rx="340" ry="280" fill="#006EF9" opacity="0.14" />
      <ellipse className="scene-backdrop__drift-b" cx="80" cy="780" rx="320" ry="260" fill="#006EF9" opacity="0.16" />
      <path
        d="M-80 210 C 140 40, 360 80, 520 210 S 820 420, 1040 310 S 1420 80, 1560 180 L 1560 520 C 1280 430, 980 560, 720 470 S 220 430, -80 540 Z"
        fill="#006EF9"
        opacity="0.08"
      />
      <circle cx="1180" cy="240" r="170" fill="#006EF9" opacity="0.1" />
      <circle className="scene-backdrop__drift-a" cx="240" cy="160" r="88" fill="#006EF9" opacity="0.12" />
      <circle cx="430" cy="520" r="36" fill="#006EF9" opacity="0.18" />
      <circle cx="980" cy="120" r="18" fill="#006EF9" opacity="0.28" />
      <path
        className="scene-backdrop__ribbon"
        d="M-40 430 C 220 250, 480 250, 720 390 S 1180 620, 1500 430"
        fill="none"
        stroke="#ffffff"
        strokeWidth="72"
        opacity="0.55"
      />
      <path
        className="scene-backdrop__ribbon"
        d="M-20 500 C 260 320, 540 340, 790 470 S 1220 680, 1480 500"
        fill="none"
        stroke="#006EF9"
        strokeWidth="2.2"
        opacity="0.22"
      />
      <path
        d="M 80 720 C 280 560, 520 640, 760 560 S 1180 400, 1460 520"
        fill="none"
        stroke="#ffffff"
        strokeWidth="48"
        opacity="0.35"
      />
      <circle cx="1320" cy="640" r="120" fill="#ffffff" opacity="0.45" />
      <circle cx="160" cy="640" r="70" fill="#ffffff" opacity="0.5" />
      <Dots id="hero-a" x={160} y={240} cols={7} rows={5} />
      <Dots id="hero-b" x={1080} y={480} cols={6} rows={6} />
    </svg>
  );
}

function FlowScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path
        className="scene-backdrop__drift-b"
        d="M-120 280 C 180 40, 420 40, 680 220 S 1120 500, 1560 260 L 1560 520 L -120 520 Z"
        fill="#006EF9"
        opacity="0.07"
      />
      <path
        d="M-40 250 C 260 90, 560 90, 820 250 S 1280 430, 1520 250"
        fill="none"
        stroke="#ffffff"
        strokeWidth="56"
        opacity="0.55"
      />
      <path
        d="M-40 270 C 260 110, 560 110, 820 270 S 1280 450, 1520 270"
        fill="none"
        stroke="#006EF9"
        strokeWidth="1.8"
        opacity="0.16"
      />
    </svg>
  );
}

function CirclesScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle className="scene-backdrop__drift-a" cx="80" cy="80" r="160" fill="#006EF9" opacity="0.08" />
      <circle cx="1360" cy="120" r="120" fill="#006EF9" opacity="0.1" />
      <circle className="scene-backdrop__drift-b" cx="1260" cy="620" r="180" fill="#006EF9" opacity="0.08" />
      <circle cx="220" cy="620" r="70" fill="#ffffff" opacity="0.7" />
      <circle cx="1180" cy="280" r="22" fill="#006EF9" opacity="0.2" />
      <circle cx="340" cy="180" r="12" fill="#006EF9" opacity="0.22" />
      <Dots id="circles" x={1240} y={360} cols={5} rows={5} />
    </svg>
  );
}

function WashScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ellipse cx="200" cy="80" rx="280" ry="180" fill="#006EF9" opacity="0.12" />
      <ellipse className="scene-backdrop__drift-a" cx="1280" cy="520" rx="300" ry="200" fill="#006EF9" opacity="0.14" />
      <path
        d="M-60 360 C 240 180, 560 180, 840 340 S 1280 560, 1520 360"
        fill="none"
        stroke="#ffffff"
        strokeWidth="64"
        opacity="0.4"
      />
      <circle cx="720" cy="120" r="16" fill="#006EF9" opacity="0.2" />
      <Dots id="wash" x={80} y={280} cols={6} rows={4} />
    </svg>
  );
}

function PageScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1440 1200" preserveAspectRatio="xMinYMin slice" aria-hidden="true">
      <ellipse cx="1400" cy="40" rx="260" ry="200" fill="#006EF9" opacity="0.07" />
      <ellipse cx="40" cy="520" rx="220" ry="180" fill="#006EF9" opacity="0.05" />
      <circle cx="1320" cy="980" r="160" fill="#006EF9" opacity="0.05" />
    </svg>
  );
}

function CtaScene() {
  return (
    <svg className="scene-backdrop__svg" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle className="scene-backdrop__drift-a" cx="80" cy="40" r="90" fill="#ffffff" opacity="0.12" />
      <circle cx="1140" cy="200" r="110" fill="#ffffff" opacity="0.1" />
      <circle cx="980" cy="40" r="28" fill="#ffffff" opacity="0.16" />
      <path
        d="M 80 180 C 280 40, 520 40, 760 140 S 1080 240, 1200 120"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0.18"
      />
    </svg>
  );
}

const scenes: Record<SceneVariant, () => ReactNode> = {
  page: PageScene,
  hero: HeroScene,
  flow: FlowScene,
  circles: CirclesScene,
  wash: WashScene,
  cta: CtaScene,
};

export function SceneBackdrop({ variant }: { variant: SceneVariant }) {
  const Scene = scenes[variant];
  return (
    <div className={`scene-backdrop scene-backdrop--${variant}`} aria-hidden="true">
      <Scene />
    </div>
  );
}
