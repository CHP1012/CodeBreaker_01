
import React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const BrutalistButton: React.FC<Props> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-2 brutalist-border brutalist-shadow transition-all active:translate-x-1 active:translate-y-1 active:shadow-none font-bold text-sm tracking-widest uppercase mb-2";
  
  const variantStyles = {
    primary: "bg-[#111111] text-[#F0F0F0] hover:bg-[#F0F0F0] hover:text-[#111111]",
    secondary: "bg-[#F0F0F0] text-[#111111] hover:bg-[#111111] hover:text-[#F0F0F0]",
    danger: "bg-[#FF3333] text-[#F0F0F0] hover:opacity-90",
    success: "bg-[#00CC66] text-[#F0F0F0] hover:opacity-90"
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
