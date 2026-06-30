'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FilterSidebar } from '@/components/map/FilterSidebar';
import { IssueBottomSheet } from '@/components/map/IssueBottomSheet';
import { ReportPinOverlay } from '@/components/map/ReportPinOverlay';
import { Layers } from 'lucide-react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const LeafletMap = dynamic(
  () => import('@/components/map/LeafletMap'),
  { ssr: false, loading: () => <div className="flex items-center justify-center w-full h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
);

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MapPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'CITIZEN';
  const isCitizen = role === 'CITIZEN';

  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportCoordinates, setReportCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { data: issueDetails } = useSWR(
    selectedIssueId ? `http://localhost:4000/api/v1/issues/${selectedIssueId}` : null,
    fetcher
  );

  return (
    <div className="relative w-screen h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Map Layer */}
      <div className="absolute inset-0">
        <LeafletMap 
          categories={categories}
          statuses={statuses}
          severities={severities}
          isReporting={isReporting}
          onReportCoordinatesChange={setReportCoordinates}
          onMarkerClick={setSelectedIssueId}
          showHeatmap={showHeatmap}
        />
      </div>

      {/* UI Overlays */}
      {!isReporting && (
        <>
          <FilterSidebar 
            categories={categories} setCategories={setCategories}
            statuses={statuses} setStatuses={setStatuses}
            severities={severities} setSeverities={setSeverities}
          />

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`absolute top-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-colors flex items-center justify-center ${
              showHeatmap ? 'bg-blue-600 text-white' : 'bg-background text-foreground hover:text-blue-600'
            }`}
            title="Toggle Heatmap"
          >
            <Layers className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Sheet for single issue */}
      <IssueBottomSheet 
        issue={issueDetails?.data || null} 
        onClose={() => setSelectedIssueId(null)} 
      />

      {/* Report Pin & Drag Logic - Only for Citizens */}
      {isCitizen && (
        <ReportPinOverlay 
          isReporting={isReporting}
          setIsReporting={setIsReporting}
          reportCoordinates={reportCoordinates}
        />
      )}
    </div>
  );
}
