export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon with Candlesticks — shine overlay */}
      <div className="relative w-10 h-10 rounded-lg bg-[#FCD535] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="5" y="10" width="4" height="8" fill="#0B0E11" rx="0.5" />
          <rect x="6.5" y="7" width="1" height="3" fill="#0B0E11" />
          <rect x="6.5" y="18" width="1" height="2" fill="#0B0E11" />
          <rect x="13" y="4" width="5" height="14" fill="#0B0E11" rx="0.5" />
          <rect x="15" y="1" width="1.5" height="3" fill="#0B0E11" />
          <rect x="15" y="18" width="1.5" height="4" fill="#0B0E11" />
        </svg>
        {/* Shine sweep over the icon box */}
        <span
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
            backgroundSize: "200% 100%",
            animation: "logo-shine 3.5s linear infinite",
          }}
        />
      </div>

      {/* Brand Text with shine sweep */}
      <span
        className="text-xl font-bold text-foreground relative"
        style={{ fontFamily: "inherit" }}
      >
        <span className="relative inline-block">
          OG{" "}
          <span
            className="text-[#FCD535] relative inline-block"
            style={{
              background: "linear-gradient(105deg, #FCD535 35%, #fff8c0 50%, #FCD535 65%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "logo-shine 3.5s linear infinite",
            }}
          >
            KAAL
          </span>{" "}
          TRADER
        </span>
      </span>
    </div>
  )
}
