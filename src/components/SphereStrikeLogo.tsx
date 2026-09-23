import React from 'react';

interface SphereStrikeLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SphereStrikeLogo: React.FC<SphereStrikeLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md'
}) => {
  // Meteor Flaming Sphere Icon Component
  const MeteorSphere = ({ iconSize = 44 }: { iconSize?: number }) => (
    <div 
      className="relative shrink-0 flex items-center justify-center select-none"
      style={{ width: iconSize, height: iconSize }}
    >
      <svg
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]"
      >
        <defs>
          {/* Cyan Plasma Trail Gradient */}
          <linearGradient id="ss-cyan-trail" x1="20" y1="90" x2="135" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>

          {/* Fiery Amber Flame Trail Gradient */}
          <linearGradient id="ss-fire-trail" x1="50" y1="100" x2="140" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ea580c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
          </linearGradient>

          {/* Sphere Body Radial Gradient */}
          <radialGradient id="ss-sphere-body" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="55%" stopColor="#0f172a" />
            <stop offset="85%" stopColor="#020617" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
          </radialGradient>

          {/* Circuit Glow Gradient */}
          <linearGradient id="ss-circuit-grad" x1="25" y1="85" x2="85" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="ss-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="ss-intense-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- COMET TAIL: FIERY FLAME & PLASMA STREAKS (Trailing up and right) --- */}
        <g filter="url(#ss-glow)">
          {/* Flame streak 1 (Main orange fire cone) */}
          <path
            d="M 68 55 Q 95 38, 136 12 Q 105 48, 80 68 Z"
            fill="url(#ss-fire-trail)"
          />
          {/* Flame streak 2 (Upper electric cyan jet) */}
          <path
            d="M 52 40 Q 82 20, 126 2 Q 92 32, 65 48 Z"
            fill="url(#ss-cyan-trail)"
          />
          {/* Flame streak 3 (Lower amber plume) */}
          <path
            d="M 78 72 Q 106 58, 138 32 Q 102 70, 72 82 Z"
            fill="url(#ss-fire-trail)"
          />
          {/* Dynamic plasma sharp rays */}
          <line x1="60" y1="42" x2="118" y2="8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <line x1="68" y1="52" x2="132" y2="18" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
          <line x1="75" y1="64" x2="138" y2="34" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="56" y1="36" x2="105" y2="6" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="82" y1="78" x2="128" y2="52" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

          {/* Sparks and flying embers */}
          <circle cx="112" cy="18" r="1.5" fill="#fef08a" />
          <circle cx="125" cy="14" r="2" fill="#fb923c" />
          <circle cx="132" cy="8" r="1.2" fill="#38bdf8" />
          <circle cx="98" cy="12" r="1.5" fill="#67e8f9" />
          <circle cx="120" cy="38" r="1.8" fill="#f59e0b" />
          <circle cx="134" cy="26" r="2" fill="#fef08a" />
          <circle cx="106" cy="30" r="1" fill="#ea580c" />
        </g>

        {/* --- CENTRAL TECH METEOR SPHERE --- */}
        <g id="sphere-core">
          {/* Outer glow ring */}
          <circle
            cx="52"
            cy="66"
            r="35"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            filter="url(#ss-glow)"
          />

          {/* Sphere Solid Base with Radial Gradient */}
          <circle
            cx="52"
            cy="66"
            r="34"
            fill="url(#ss-sphere-body)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Wireframe Facet Polygons & Geodesic Lines */}
          <g stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" fill="none">
            <polygon points="52,34 68,46 52,66 36,46" />
            <polygon points="52,66 68,46 80,66 68,86" />
            <polygon points="52,66 36,46 24,66 36,86" />
            <polygon points="52,66 68,86 52,98 36,86" />
          </g>

          {/* Glowing Electronic Circuit Traces with Solder Pads */}
          <g filter="url(#ss-glow)" stroke="url(#ss-circuit-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Circuit Line 1 (Center bus) */}
            <path d="M 38 66 H 48 V 52 H 60 V 44" />
            {/* Circuit Line 2 (Horizontal branch) */}
            <path d="M 44 76 H 58 V 64 H 68" />
            {/* Circuit Line 3 (Lower curve) */}
            <path d="M 34 54 H 40 V 62" />
            {/* Circuit Line 4 (Right branch to comet trail) */}
            <path d="M 52 82 V 74 H 64 V 60 H 76" />
          </g>

          {/* Circuit Nodes / Solder Terminal Pads */}
          <g fill="#38bdf8" filter="url(#ss-glow)">
            <circle cx="38" cy="66" r="2.2" />
            <circle cx="60" cy="44" r="2.5" fill="#67e8f9" />
            <circle cx="44" cy="76" r="2" />
            <circle cx="68" cy="64" r="2.2" fill="#fb923c" />
            <circle cx="76" cy="60" r="2.5" fill="#f59e0b" />
            <circle cx="34" cy="54" r="1.8" />
            <circle cx="52" cy="82" r="2" fill="#f97316" />
            <circle cx="52" cy="34" r="1.8" />
          </g>

          {/* Inner Nodes Glowing Centers */}
          <g fill="#ffffff">
            <circle cx="60" cy="44" r="1.2" />
            <circle cx="68" cy="64" r="1.2" />
            <circle cx="76" cy="60" r="1.2" />
          </g>
        </g>

        {/* --- BRIGHT LASER FLARE / STARBURST (Bottom-left impact cutting through sphere) --- */}
        <g filter="url(#ss-intense-glow)">
          {/* Diagonal Laser Beam */}
          <line x1="16" y1="94" x2="88" y2="40" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <line x1="20" y1="92" x2="84" y2="42" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          
          {/* Star Flare Core at (32, 82) */}
          <path
            d="M 32 74 Q 32 82 24 82 Q 32 82 32 90 Q 32 82 40 82 Q 32 82 32 74 Z"
            fill="#ffffff"
          />
          <circle cx="32" cy="82" r="3" fill="#fef08a" />
          <circle cx="32" cy="82" r="1.5" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );

  // Sizing styles
  const textSizes = {
    sm: { main: 'text-sm', strike: 'text-sm', sub: 'text-[8px]', gap: 'gap-1.5' },
    md: { main: 'text-lg', strike: 'text-lg', sub: 'text-[9.5px]', gap: 'gap-2.5' },
    lg: { main: 'text-2xl', strike: 'text-2xl', sub: 'text-xs', gap: 'gap-3' },
    xl: { main: 'text-3xl sm:text-4xl', strike: 'text-3xl sm:text-4xl', sub: 'text-xs sm:text-sm', gap: 'gap-4' },
  }[size];

  const iconDimensions = {
    sm: 34,
    md: 46,
    lg: 64,
    xl: 96,
  }[size];

  // Variant: ICON ONLY
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <MeteorSphere iconSize={iconDimensions} />
      </div>
    );
  }

  // Variant: FULL STACKED (Exact replica of the uploaded image!)
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Glowing Comet Sphere Icon */}
        <div className="relative">
          <MeteorSphere iconSize={size === 'xl' ? 140 : size === 'lg' ? 100 : 72} />
        </div>

        {/* Wordmark Typography matching image.png */}
        <div className="flex flex-col items-center mt-2 w-full max-w-sm">
          {/* SPHERE STRIKE Title */}
          <div className="flex items-center justify-center gap-2 font-['Outfit'] font-black tracking-wider leading-none">
            <span 
              className={`${textSizes.main} text-transparent bg-clip-text bg-gradient-to-b from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] drop-shadow-[0_0_12px_rgba(56,189,248,0.7)] uppercase`}
            >
              SPHERE
            </span>
            <span 
              className={`${textSizes.strike} text-transparent bg-clip-text bg-gradient-to-b from-[#fde047] via-[#fb923c] to-[#f97316] drop-shadow-[0_0_12px_rgba(249,115,22,0.75)] uppercase`}
            >
              STRIKE
            </span>
          </div>

          {/* Underneath: — GAMES — */}
          <div className="flex items-center justify-center gap-3 w-full mt-1.5 px-4">
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-white/90 rounded-full" />
            <span 
              className={`${textSizes.sub} font-black font-['Outfit'] tracking-[0.35em] text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] shrink-0`}
            >
              GAMES
            </span>
            <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-white/80 to-white/90 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Variant: HORIZONTAL (For Navbar & Sidebar Header)
  return (
    <div className={`flex items-center ${textSizes.gap} select-none ${className}`}>
      <MeteorSphere iconSize={iconDimensions} />

      <div className="flex flex-col justify-center leading-tight">
        {/* SPHERE STRIKE */}
        <div className="flex items-center gap-1.5 font-['Outfit'] font-black tracking-wider leading-none">
          <span className={`${textSizes.main} text-transparent bg-clip-text bg-gradient-to-b from-[#38bdf8] to-[#0284c7] drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] uppercase`}>
            SPHERE
          </span>
          <span className={`${textSizes.strike} text-transparent bg-clip-text bg-gradient-to-b from-[#fde047] via-[#fb923c] to-[#f97316] drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] uppercase`}>
            STRIKE
          </span>
        </div>

        {/* GAMES with sleek horizontal rules */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-transparent to-white/70" />
          <span className={`${textSizes.sub} font-black font-['Outfit'] tracking-[0.3em] text-white uppercase drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]`}>
            GAMES
          </span>
          <div className="flex-1 min-w-4 h-[1px] bg-gradient-to-l from-transparent to-white/70" />
        </div>
      </div>
    </div>
  );
};
