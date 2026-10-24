import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export default function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const badgeSizes = {
    sm: 'text-[8px] px-1 py-0.2',
    md: 'text-[9px] px-1.5 py-0.5',
    lg: 'text-[10px] px-2 py-0.5',
    xl: 'text-xs px-2.5 py-0.5',
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 group ${className}`}>
      {/* Icon Mark */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-[#101A36] border border-emerald-500/30 shadow-md shadow-emerald-950/30 transition-transform duration-200 group-hover:scale-105 overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent opacity-80" />

        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 relative z-10"
        >
          <defs>
            <linearGradient id="mintRoofGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="mintBar1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="mintBar2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="mintBar3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Roof Polyline representing the Home */}
          <path
            d="M 10 28 L 32 13 L 54 28"
            stroke="url(#mintRoofGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Financial Growth Bars */}
          <rect x="18" y="34" width="5.5" height="14" rx="1.5" fill="url(#mintBar1)" />
          <rect x="27.5" y="27" width="5.5" height="21" rx="1.5" fill="url(#mintBar2)" />
          <rect x="37" y="22" width="5.5" height="26" rx="1.5" fill="url(#mintBar3)" />

          {/* Spark node */}
          <circle cx="48" cy="15" r="2.5" fill="#34D399" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`${textSizes[size]} font-bold text-slate-100 tracking-tight leading-none`}>
              Hogar<span className="text-emerald-400">IQ</span>
            </span>
            <span
              className={`${badgeSizes[size]} font-semibold rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tracking-wider leading-none`}
            >
              HOGAR
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase mt-0.5">
              Finanzas Familiares
            </span>
          )}
        </div>
      )}
    </div>
  );
}
