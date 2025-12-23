
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-[#F0F0F0] brutalist-border brutalist-shadow w-full max-w-sm sm:max-w-md p-5 sm:p-6 relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2 flex-shrink-0">
          <h2 className="text-lg sm:text-xl heading font-bold">{title}</h2>
          <button onClick={onClose} className="font-bold hover:text-red-600 text-xl p-1">×</button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
