'use client';

import React from 'react';
import Image from 'next/image';

interface DietarySymbolProps {
  isVeg?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const DietarySymbol: React.FC<DietarySymbolProps> = ({
  isVeg = true,
  size = 'sm',
  className = '',
  showLabel = false,
}) => {
  // Dimensions for square container & inner shapes
  const dimensions = {
    xs: { box: 14, stroke: 2, circleR: 3.5, triPoints: '7,3 11.5,10.5 2.5,10.5' },
    sm: { box: 18, stroke: 2, circleR: 4.5, triPoints: '9,4 14.5,13.5 3.5,13.5' },
    md: { box: 22, stroke: 2.5, circleR: 5.5, triPoints: '11,4.5 18,16.5 4,16.5' },
    lg: { box: 28, stroke: 3, circleR: 7, triPoints: '14,6 23,21 5,21' },
  }[size];

  const vegColor = '#2e7d32'; // Indian FSSAI Vegetarian Green
  const nonVegColor = '#7d4a2f'; // Indian FSSAI Non-Vegetarian Brown

  return (
    <div
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      {isVeg ? (
        <svg
          width={dimensions.box}
          height={dimensions.box}
          viewBox={`0 0 ${dimensions.box} ${dimensions.box}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <rect
            x={dimensions.stroke / 2}
            y={dimensions.stroke / 2}
            width={dimensions.box - dimensions.stroke}
            height={dimensions.box - dimensions.stroke}
            rx={2}
            stroke={vegColor}
            strokeWidth={dimensions.stroke}
            fill="#ffffff"
          />
          <circle
            cx={dimensions.box / 2}
            cy={dimensions.box / 2}
            r={dimensions.circleR}
            fill={vegColor}
          />
        </svg>
      ) : (
        <svg
          width={dimensions.box}
          height={dimensions.box}
          viewBox={`0 0 ${dimensions.box} ${dimensions.box}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <rect
            x={dimensions.stroke / 2}
            y={dimensions.stroke / 2}
            width={dimensions.box - dimensions.stroke}
            height={dimensions.box - dimensions.stroke}
            rx={2}
            stroke={nonVegColor}
            strokeWidth={dimensions.stroke}
            fill="#ffffff"
          />
          <polygon points={dimensions.triPoints} fill={nonVegColor} />
        </svg>
      )}

      {showLabel && (
        <span
          className={`font-semibold tracking-wider uppercase text-[10px] ${
            isVeg ? 'text-emerald-800' : 'text-[#7d4a2f]'
          }`}
        >
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}
    </div>
  );
};

interface GlutenFreeSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const GlutenFreeSymbol: React.FC<GlutenFreeSymbolProps> = ({
  size = 'sm',
  className = '',
  showLabel = false,
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-[18px] h-[18px]',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1 select-none ${className}`}
      title="Gluten Free"
    >
      <div className={`relative ${sizeClasses} shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/icons/gluten-free-badge.png"
          alt="Gluten Free"
          className="w-full h-full object-contain"
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-bold text-amber-950 tracking-tight whitespace-nowrap">
          Gluten Free
        </span>
      )}
    </div>
  );
};

interface DietaryBadgeGroupProps {
  isVeg?: boolean;
  isGlutenFree?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const DietaryBadgeGroup: React.FC<DietaryBadgeGroupProps> = ({
  isVeg = true,
  isGlutenFree = false,
  size = 'sm',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-1 rounded-md border border-stone-200/80 shadow-2xs ${className}`}
    >
      {isGlutenFree && <GlutenFreeSymbol size={size} />}
      <DietarySymbol isVeg={isVeg} size={size} />
    </div>
  );
};

export default DietarySymbol;
