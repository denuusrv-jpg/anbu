export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        className="h-full w-full scale-125"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a1d12" />
            <stop offset="28%" stopColor="#4a3018" />
            <stop offset="52%" stopColor="#120d08" />
            <stop offset="72%" stopColor="#0e211f" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <filter
            id="flowNoise"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004 0.007"
              numOctaves="2"
              seed="12"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="45s"
                values="0.004 0.007;0.006 0.009;0.004 0.007"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="260"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <rect
          className="flow-rect"
          width="1440"
          height="900"
          fill="url(#flowGradient)"
          filter="url(#flowNoise)"
        />
      </svg>
      <div className="absolute inset-0 bg-zinc-950/30" />
    </div>
  );
}
