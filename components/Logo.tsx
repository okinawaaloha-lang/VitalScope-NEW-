import React from 'react';
import clsx from 'clsx';

interface LogoProps {
  size?: number;
  variant?: 'solid' | 'soft';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, variant = 'solid', className }) => {
  const isSoft = variant === 'soft';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('shrink-0', className)}
      aria-label="VitalScope"
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        className={isSoft ? 'fill-teal-100' : 'fill-teal-600'}
      />
      <circle
        cx="24"
        cy="24"
        r="15"
        className={isSoft ? 'stroke-teal-400' : 'stroke-teal-200'}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="2 3"
      />
      <path
        d="M9 24 H16 L19 18 L23 30 L26 22 L29 26 L32 24 H39"
        className={isSoft ? 'stroke-teal-700' : 'stroke-white'}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default Logo;
