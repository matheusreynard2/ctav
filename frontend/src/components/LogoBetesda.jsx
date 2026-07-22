export default function LogoBetesda({
  className = '',
  alt = 'Betesda Care Sistemas',
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 250"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={alt}
    >
      <defs>
        <linearGradient id="betesdaHeartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      <g transform="translate(150 90)">
        <path
          d="M 0 32 C -52 0 -78 -30 -52 -56 C -32 -72 -12 -56 0 -40 C 12 -56 32 -72 52 -56 C 78 -30 52 0 0 32 Z"
          fill="url(#betesdaHeartGrad)"
        />
        <rect x="-6" y="-50" width="12" height="36" rx="2.5" fill="white" />
        <rect x="-18" y="-38" width="36" height="12" rx="2.5" fill="white" />
      </g>

      <text
        x="150"
        y="176"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="42"
        fontWeight="700"
        fill="#1d4ed8"
      >
        Betesda Care
      </text>
      <text
        x="150"
        y="212"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="8"
        fill="#60a5fa"
      >
        SISTEMAS
      </text>
    </svg>
  );
}
