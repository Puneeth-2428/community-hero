'use client';

import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterSidebarProps {
  categories: string[];
  setCategories: (categories: string[]) => void;
  statuses: string[];
  setStatuses: (statuses: string[]) => void;
  severities: string[];
  setSeverities: (severities: string[]) => void;
}

const CATEGORY_OPTIONS = [
  'POTHOLE', 'STREETLIGHT', 'GARBAGE', 'WATER_SUPPLY', 'SEWAGE',
  'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'NOISE_COMPLAINT', 'PUBLIC_SAFETY', 'PARK_MAINTENANCE'
];
const STATUS_OPTIONS = ['OPEN', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const FilterSidebar = ({
  categories, setCategories,
  statuses, setStatuses,
  severities, setSeverities
}: FilterSidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) setCategories(categories.filter(c => c !== cat));
    else setCategories([...categories, cat]);
  };

  const toggleStatus = (status: string) => {
    if (statuses.includes(status)) setStatuses(statuses.filter(s => s !== status));
    else setStatuses([...statuses, status]);
  };

  const toggleSeverity = (sev: string) => {
    if (severities.includes(sev)) setSeverities(severities.filter(s => s !== sev));
    else setSeverities([...severities, sev]);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-4 z-[1000] bg-card p-3 rounded-full shadow-lg text-foreground hover:text-blue-600 transition-colors"
      >
        <Filter className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-card/95 backdrop-blur-md shadow-xl z-[1000] overflow-y-auto p-6 transition-transform transform translate-x-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Filters</h2>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Categories</h3>
          <div className="space-y-2">
            {CATEGORY_OPTIONS.map(cat => (
              <label key={cat} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-foreground capitalize">{cat.replace('_', ' ').toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Status</h3>
          <div className="space-y-2">
            {STATUS_OPTIONS.map(status => (
              <label key={status} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                  className="w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-foreground capitalize">{status.replace('_', ' ').toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Severity</h3>
          <div className="space-y-2">
            {SEVERITY_OPTIONS.map(sev => (
              <label key={sev} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={severities.includes(sev)}
                  onChange={() => toggleSeverity(sev)}
                  className="w-4 h-4 rounded border-border text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-foreground capitalize">{sev.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
