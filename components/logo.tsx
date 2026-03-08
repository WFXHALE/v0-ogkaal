export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon with Candlesticks */}
      <div className="relative w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Small Candlestick */}
          <rect x="5" y="10" width="4" height="8" fill="#0a0a0f" rx="0.5" />
          <rect x="6.5" y="7" width="1" height="3" fill="#0a0a0f" />
          <rect x="6.5" y="18" width="1" height="2" fill="#0a0a0f" />
          
          {/* Large Candlestick */}
          <rect x="13" y="4" width="5" height="14" fill="#0a0a0f" rx="0.5" />
          <rect x="15" y="1" width="1.5" height="3" fill="#0a0a0f" />
          <rect x="15" y="18" width="1.5" height="4" fill="#0a0a0f" />
        </svg>
      </div>
      
      {/* Brand Text */}
      <span className="text-xl font-bold text-foreground">
        OG <span className="text-[#d4af37]">KAAL</span> TRADER
      </span>
    </div>
  )
}
