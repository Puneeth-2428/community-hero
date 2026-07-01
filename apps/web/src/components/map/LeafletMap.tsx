'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useSWR from 'swr';
import { useSocket } from '@/hooks/useSocket';

interface LeafletMapProps {
  categories: string[];
  statuses: string[];
  severities: string[];
  isReporting: boolean;
  onReportCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  onMarkerClick: (issueId: string) => void;
  showHeatmap: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to track map center when dragging for reporting
function CenterTracker({ isReporting, onLocationSelect }: { isReporting: boolean, onLocationSelect: (coords: any) => void }) {
  const map = useMapEvents({
    move() {
      if (isReporting) {
        onLocationSelect(map.getCenter());
      }
    }
  });

  useEffect(() => {
    if (isReporting) {
      onLocationSelect(map.getCenter());
    } else {
      onLocationSelect(null);
    }
  }, [isReporting, map]);

  return null;
}

export default function LeafletMap({
  categories,
  statuses,
  severities,
  isReporting,
  onReportCoordinatesChange,
  onMarkerClick,
  showHeatmap
}: LeafletMapProps) {
  const [position, setPosition] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => console.log('Geolocation denied, using default')
    );
  }, []);

  const queryParams = new URLSearchParams();
  if (categories.length) queryParams.set('categories', categories.join(','));
  if (statuses.length) queryParams.set('statuses', statuses.join(','));
  if (severities.length) queryParams.set('severities', severities.join(','));

  const swrKey = `${process.env.NEXT_PUBLIC_API_URL}/issues?${queryParams.toString()}`;
  const { data: issuesData, mutate } = useSWR(swrKey, fetcher);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const onIssueCreated = () => mutate();
    socket.on('issue:created', onIssueCreated);
    return () => { socket.off('issue:created', onIssueCreated); };
  }, [socket, mutate]);

  const issues = issuesData?.data || [];

  return (
    <div className="relative w-full h-full">
      <MapContainer center={position} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {issues.map((issue: any) => (
          <Marker 
            key={issue.id} 
            position={[issue.latitude, issue.longitude]}
            eventHandlers={{ click: () => onMarkerClick(issue.id) }}
          />
        ))}

        <CenterTracker isReporting={isReporting} onLocationSelect={onReportCoordinatesChange} />
      </MapContainer>

      {isReporting && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
          <div className="w-8 h-8 border-2 border-blue-600 rounded-full flex items-center justify-center bg-blue-600/20 shadow-xl">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
