'use client';

import React from 'react';
import { MapPin, Check, X } from 'lucide-react';
import Link from 'next/link';

interface ReportPinOverlayProps {
  isReporting: boolean;
  setIsReporting: (val: boolean) => void;
  reportCoordinates: { lat: number; lng: number } | null;
}

export const ReportPinOverlay = ({ isReporting, setIsReporting, reportCoordinates }: ReportPinOverlayProps) => {
  
  if (!isReporting) {
    return (
      <button 
        onClick={() => setIsReporting(true)}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-foreground text-background px-6 py-3 rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
      >
        <MapPin className="w-5 h-5 text-red-500" />
        Report Issue Here
      </button>
    );
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-card px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center border border-border">
      <div className="text-foreground font-semibold mb-3">Drag the map to pinpoint the exact location</div>
      
      {reportCoordinates && (
        <div className="text-xs text-muted-foreground mb-4 bg-muted px-3 py-1 rounded-full">
          {reportCoordinates.lat.toFixed(6)}, {reportCoordinates.lng.toFixed(6)}
        </div>
      )}

      <div className="flex gap-4">
        <button 
          onClick={() => setIsReporting(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        
        {reportCoordinates ? (
          <Link 
            href={`/report?lat=${reportCoordinates.lat}&lng=${reportCoordinates.lng}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" /> Confirm Location
          </Link>
        ) : (
          <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-blue-400 cursor-not-allowed opacity-70">
            <Check className="w-4 h-4" /> Loading...
          </button>
        )}
      </div>
    </div>
  );
};
