"use client";
import React, { useState, useEffect } from 'react';
import { useTimelineContext } from '@/app/contexts/TimelineContext';
import type { TimelineEpoch } from '@/types/timeline';
import { useMapElementsByYear } from '@/hooks/queries/useMapElements';
import { usePanelWidth } from '@/hooks/ui/usePanelWidth';
import DescriptionEditor from '@/app/components/editor/DescriptionEditor';
import '@/css/dialogs/base-dialog.css';
import '@/css/panels/sidepanel.css';

interface EpochDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  epoch?: TimelineEpoch;
  onClose: () => void;
}

export function EpochDialog({ isOpen, mode, epoch, onClose }: EpochDialogProps) {
  const { createEpoch, updateEpoch, currentYear, fetchTimeline } = useTimelineContext();
  const { locations, regions } = useMapElementsByYear(currentYear);
  const { width, handleMouseDown } = usePanelWidth();
  
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endYear, setEndYear] = useState<number>(currentYear + 100);
  const [yearPrefix, setYearPrefix] = useState<string>('');
  const [yearSuffix, setYearSuffix] = useState<string>('');
  const [restartAtZero, setRestartAtZero] = useState<boolean>(false);
  const [showEndDate, setShowEndDate] = useState<boolean>(true);
  const [reverseYears, setReverseYears] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && epoch) {
        setName(epoch.name);
        setDescription(epoch.description || '');
        setStartYear(epoch.startYear);
        setEndYear(epoch.endYear);
        setYearPrefix(epoch.yearPrefix || '');
        setYearSuffix(epoch.yearSuffix || '');
        setRestartAtZero(epoch.restartAtZero || false);
        setShowEndDate(epoch.showEndDate !== false); // Default to true if not explicitly set
        setReverseYears(epoch.reverseYears || false);
      } else {
        setName('');
        setDescription('');
        setStartYear(currentYear);
        setEndYear(currentYear + 100);
        setYearPrefix('');
        setYearSuffix('');
        setRestartAtZero(false);
        setShowEndDate(true);
        setReverseYears(false);
      }
    }
  }, [isOpen, mode, epoch, currentYear]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    if (startYear >= endYear) {
      return;
    }

    setSaving(true);
    try {
      const epochData = {
        name: name.trim(),
        description: description.trim(),
        startYear,
        endYear,
        yearPrefix,
        yearSuffix,
        restartAtZero,
        showEndDate,
        reverseYears
      };

      if (mode === 'create') {
        await createEpoch(epochData);
      } else if (epoch) {
        await updateEpoch(epoch.id, epochData);
      }
      
      await fetchTimeline();
      onClose();
    } catch (error) {
      console.error('Failed to save epoch:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to prevent clicks from reaching TimelineSlider */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10003,
          background: 'transparent'
        }}
        onClick={onClose}
      />
      <div
        className="sidepanel"
        style={{ 
          width,
          background: 'rgba(0,0,0,0.9)', // Permanent hover background
          zIndex: 10004 // Higher than TimelineSlider (10002)
        }}
        data-testid="timeline-epoch-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidepanel-drag-handle" onMouseDown={handleMouseDown} />
        <div className="sidepanel-header">
          <div className="flex-1">
            <h2 className="sidepanel-title text-lg font-semibold text-gray-100">
              {mode === 'create' ? 'Create Epoch' : 'Edit Epoch'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {mode === 'create' ? 'Define a new time period' : `Editing: ${epoch?.name}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl ml-4">×</button>
        </div>
        <div className="sidepanel-content flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="Epoch name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <DescriptionEditor 
              value={description} 
              onChange={setDescription} 
              elements={[...locations, ...regions]} 
              rows={6} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Year *
              </label>
              <input
                type="number"
                className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={startYear}
                onChange={e => setStartYear(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Year *
              </label>
              <input
                type="number"
                className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={endYear}
                onChange={e => setEndYear(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Year Prefix
            </label>
            <input
              type="text"
              className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={yearPrefix}
              onChange={e => setYearPrefix(e.target.value)}
              placeholder="e.g., 'Year '"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Year Suffix
            </label>
            <input
              type="text"
              className="w-full rounded bg-gray-800 text-gray-100 px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={yearSuffix}
              onChange={e => setYearSuffix(e.target.value)}
              placeholder="e.g., ' AR'"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                checked={restartAtZero}
                onChange={e => setRestartAtZero(e.target.checked)}
              />
              <span>Restart year counter at start of this epoch</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                checked={reverseYears}
                onChange={e => setReverseYears(e.target.checked)}
              />
              <span>Reverse year counting (like BC/AD system)</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-600"
                checked={showEndDate}
                onChange={e => setShowEndDate(e.target.checked)}
              />
              <span>Show end date</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1 rounded"
            disabled={saving || !name.trim() || startYear >= endYear}
          >
            {saving ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
          </button>
        </div>
      </div>
    </>
  );
} 