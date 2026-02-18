
import React from 'react';

export const LumaIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="luma-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100" height="100" rx="24" fill="#0F172A" />
    <path 
      d="M30 25V75H70" 
      stroke="url(#luma-icon-grad)" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      filter="url(#glow)"
    />
    <path 
      d="M45 55L55 45L75 65" 
      stroke="white" 
      strokeWidth="8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="75" cy="65" r="5" fill="white" />
  </svg>
);

export const LumaLogo = ({ height = 40, className = "" }: { height?: number, className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <LumaIcon size={height} />
    <div className="flex flex-col">
      <span className="text-white font-black uppercase tracking-tighter leading-none" style={{ fontSize: height * 0.45 }}>
        LumaTrade
      </span>
      <span className="text-blue-500 font-bold uppercase tracking-[0.3em] mt-1" style={{ fontSize: height * 0.2 }}>
        FX Institutional
      </span>
    </div>
  </div>
);
