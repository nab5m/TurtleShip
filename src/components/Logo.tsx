// 거북선 로고 — 인장 붉은색 바탕 + 거북 등껍질·물결(거북선). 앱 아이콘과 동일 모티프.
export default function Logo({ className }: { className?: string }) {
  const RED = "#b5432f";
  const CREAM = "#f7edd9";
  return (
    <svg
      viewBox="0 0 512 512"
      className={className ?? "h-7 w-7"}
      role="img"
      aria-label="거북선 로고"
    >
      <rect width="512" height="512" rx="112" fill={RED} />
      <g stroke={CREAM} strokeWidth="15" strokeLinecap="round" fill="none">
        <path d="M92 380 q41 -28 82 0 t82 0 t82 0 t82 0" />
        <path d="M110 418 q37 -24 74 0 t74 0 t74 0" opacity="0.55" />
      </g>
      <path d="M124 330 L94 322 L122 346 Z" fill={CREAM} />
      <ellipse cx="182" cy="352" rx="20" ry="14" fill={CREAM} />
      <ellipse cx="322" cy="352" rx="20" ry="14" fill={CREAM} />
      <path d="M118 338 Q118 158 256 158 Q394 158 394 338 Z" fill={CREAM} />
      <rect x="110" y="330" width="292" height="20" rx="10" fill={CREAM} />
      <ellipse cx="420" cy="300" rx="28" ry="21" fill={CREAM} />
      <circle cx="429" cy="293" r="4.5" fill={RED} />
      <g stroke={RED} strokeWidth="13" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M256 210 L300 236 L300 288 L256 314 L212 288 L212 236 Z" />
        <path d="M256 210 L256 174" />
        <path d="M300 236 L338 214" />
        <path d="M212 236 L174 214" />
        <path d="M300 288 L338 310" />
        <path d="M212 288 L174 310" />
      </g>
    </svg>
  );
}
