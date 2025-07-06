import { useCallback, useEffect, useRef } from 'react';
import type { Map } from 'leaflet';

interface MapEventHandlers {
  onZoomStart?: () => void;
  onZoom?: (zoom: number) => void;
  onZoomEnd?: (zoom: number) => void;
  onMove?: (center: [number, number]) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}

export function useMapEvents(map: Map | null, handlers: MapEventHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const onZoomStart = useCallback(() => {
    handlersRef.current.onZoomStart?.();
  }, []);

  const onZoom = useCallback(() => {
    if (!map) return;
    handlersRef.current.onZoom?.(map.getZoom());
  }, [map]);

  const onZoomEnd = useCallback(() => {
    if (!map) return;
    handlersRef.current.onZoomEnd?.(map.getZoom());
  }, [map]);

  const onMove = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    handlersRef.current.onMove?.([center.lat, center.lng]);
  }, [map]);

  const onMoveStart = useCallback(() => {
    handlersRef.current.onMoveStart?.();
  }, []);

  const onMoveEnd = useCallback(() => {
    handlersRef.current.onMoveEnd?.();
  }, []);

  useEffect(() => {
    if (!map) return;

    map.on('zoomstart', onZoomStart);
    map.on('zoom', onZoom);
    map.on('zoomend', onZoomEnd);
    map.on('move', onMove);
    map.on('movestart', onMoveStart);
    map.on('moveend', onMoveEnd);

    return () => {
      map.off('zoomstart', onZoomStart);
      map.off('zoom', onZoom);
      map.off('zoomend', onZoomEnd);
      map.off('move', onMove);
      map.off('movestart', onMoveStart);
      map.off('moveend', onMoveEnd);
    };
  }, [map, onZoomStart, onZoom, onZoomEnd, onMove, onMoveStart, onMoveEnd]);
} 