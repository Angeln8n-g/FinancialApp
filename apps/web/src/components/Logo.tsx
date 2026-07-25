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
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
    xl: 'text-sm px-2.5 py-1',
  };

  return (
    <div className={`inline-flex items-center space-x-3 group ${className}`}>
      {/* Icon Mark with Glowing Gradient Card */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-purple-500/30 shadow-lg shadow-purple-950/40 transition-transform duration-300 group-hover:scale-105 overflow-hidden`}
      >
        {/* Inner ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-indigo-500/10 to-cyan-400/20 opacity-80 group-hover:opacity-100 transition-opacity" />

        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 relative z-10"
        >
          <defs>
            <linearGradient id="compRoofGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="compBar1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="compBar2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
            <linearGradient id="compBar3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Roof Polyline */}
          <path
            d="M 10 28 L 32 13 L 54 28"
            stroke="url(#compRoofGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Financial Bars */}
          <rect x="18" y="33" width="5.5" height="15" rx="1.5" fill="url(#compBar1)" />
          <rect x="27.5" y="26" width="5.5" height="22" rx="1.5" fill="url(#compBar2)" />
          <rect x="37" y="20" width="5.5" height="28" rx="1.5" fill="url(#compBar3)" />

          {/* AI Neural Spark */}
          <circle cx="49" cy="14" r="3.5" fill="#38BDF8" />
          <circle cx="49" cy="14" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`${textSizes[size]} font-extrabold text-white tracking-tight leading-none`}>
              Hogar<span className="text-purple-400">IQ</span>
            </span>
            <span
              className={`${badgeSizes[size]} font-bold rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white tracking-wider leading-none shadow-sm`}
            >
              AI
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
              Asistente Financiero
            </span>
          )}
        </div>
      )}
    </div>
  );
}
