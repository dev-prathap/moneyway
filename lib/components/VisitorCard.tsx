import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { VisitorData } from '../types';

interface VisitorCardProps {
  data: VisitorData;
  scale?: number;
}

export const VisitorCard: React.FC<VisitorCardProps> = ({ data, scale = 1 }) => {
  // Format dates to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const dateRange = `${formatDate(data.startDate || '')} To ${formatDate(data.endDate || '')}`;

  return (
    <div 
      className="relative bg-white shadow-2xl overflow-hidden flex flex-col items-center select-none"
      style={{
        width: `${320 * scale}px`,
        height: `${550 * scale}px`,
        // The card in the image has a specific rounded look, but printed cards are usually square corners. 
        // We'll add slight radius for the digital preview.
        borderRadius: `${16 * scale}px`,
        fontSize: `${scale}rem` // Base font size scaling
      }}
    >
      {/* Top Wave Decoration */}
      <div className="absolute top-0 left-0 w-full z-0">
        <svg viewBox="0 0 320 80" className="w-full h-auto drop-shadow-sm">
          <path 
            d="M0,0 L320,0 L320,25 Q240,60 160,25 Q80,-10 0,25 Z" 
            fill="#F58220" 
          />
          {/* Secondary softer wave for aesthetics matching image header style */}
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center pt-8 pb-4 px-4">
        {/* Header Title */}
        <h1 
          className="font-bold text-maniway-blue text-center tracking-tight"
          style={{ 
            fontSize: `${28 * scale}px`, 
            lineHeight: 1.2, 
            marginTop: `${10 * scale}px` 
          }}
        >
          Maniway Township
        </h1>

        {/* Logo Replication */}
        <div 
          className="flex items-center justify-center mt-4 mb-2"
          style={{
            width: `${240 * scale}px`,
            height: `${120 * scale}px`
          }}
        >
          <div className="w-full h-full bg-maniway-yellow rounded-[50%] flex flex-col items-center justify-center relative shadow-sm border border-yellow-400/30">
            <span 
              className="font-black text-maniway-red italic tracking-tighter"
              style={{ 
                fontSize: `${42 * scale}px`, 
                textShadow: '1px 1px 0px rgba(255,255,255,0.5)' 
              }}
            >
              Maniway
            </span>
            {/* Underline swoosh simulation */}
            <div 
              className="w-2/3 h-1 bg-green-700 rounded-full mb-1 opacity-80" 
              style={{ marginTop: `-${4 * scale}px`}}
            ></div>
            <span 
              className="font-bold text-maniway-red tracking-widest uppercase"
              style={{ fontSize: `${12 * scale}px` }}
            >
              TOWNSHIP
            </span>
          </div>
        </div>

        {/* Date and Location */}
        <div 
          className="text-center font-medium text-maniway-blue" 
          style={{ 
            fontSize: `${14 * scale}px`, 
            marginTop: `${10 * scale}px` 
          }}
        >
          <p>{dateRange}</p>
          <p className="mt-1">{data.location}</p>
        </div>

        {/* QR Code - Moved up for better spacing */}
        <div 
          className="bg-white p-1" 
          style={{ 
            marginBottom: `${15 * scale}px`, 
            marginTop: `${15 * scale}px`
          }}
        >
          <QRCodeSVG 
            value={JSON.stringify(data)} 
            size={130 * scale}
            level="M"
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
        </div>

        {/* Visitor ID */}
        <div 
          className="text-center font-bold text-black tracking-wide"
          style={{ 
            fontSize: `${24 * scale}px`, 
            marginTop: `${5 * scale}px`,
            marginBottom: `${10 * scale}px`,
            fontWeight: 'bold'
          }}
        >
          {data.visitorId}
        </div>

        {/* Footer Role */}
        <div className="mt-auto mb-6 z-20">
          <span 
            className="font-bold text-maniway-blue"
            style={{ fontSize: `${32 * scale}px` }}
          >
            {data.type}
          </span>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 w-full z-0">
        <svg viewBox="0 0 320 60" className="w-full h-auto" preserveAspectRatio="none">
          <path 
            d="M0,60 L320,60 L320,10 Q160,60 0,10 Z" 
            fill="#F58220" 
          />
        </svg>
      </div>
    </div>
  );
};
