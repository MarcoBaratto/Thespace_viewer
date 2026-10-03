'use client';

import React from 'react';
import { X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Image from 'next/image';

interface SeatMapModalProps {
  selectedSala: string | null;
  onClose: () => void;
}

export default function SeatMapModal({ selectedSala, onClose }: SeatMapModalProps) {
  if (!selectedSala) return null;

  const imageSrc = `/seats/${selectedSala.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png?v=3`;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#18181b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
          <h2 className="font-bold text-lg text-white">Mappa: {selectedSala}</h2>
          <div className="flex gap-4 items-center">
             <span className="text-xs text-gray-400 hidden sm:block">Usa la rotellina o le dita per ingrandire</span>
             <button onClick={onClose} className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-black p-4 flex justify-center items-center h-full relative cursor-grab active:cursor-grabbing min-h-[300px]">
          <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
              {/* Using standard img here because it needs to scale nicely with the TransformWrapper, 
                  and Next.js Image component handles width/height in a way that might conflict with pinch-to-zoom easily. 
                  If we use next/image we must use layout="fill" or similar. standard img is safer for this specific case. */}
              <img 
                src={imageSrc} 
                alt={`Mappa ${selectedSala}`} 
                className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/5 object-contain pointer-events-none" 
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}
