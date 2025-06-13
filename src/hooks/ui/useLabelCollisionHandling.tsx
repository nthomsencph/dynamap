import { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import type L from 'leaflet';
import type { MapElement } from '@/types/elements';

/**
 * Custom hook for handling label collision strategies on a Leaflet map.
 * Usage:
 *   useLabelCollisionHandling(elements, map, isZooming);
 *
 * All label divs must have id={element.id}.
 */
export function useLabelCollisionHandling(
  elements: MapElement[], 
  map: L.Map | null, 
  isZooming: boolean
) {
  const labelVisibility = useRef<Record<string, boolean>>({});
  const hiddenElements = useRef<Set<string>>(new Set());
  const observerRef = useRef<MutationObserver | null>(null);

  // Main collision logic
  const applyCollisionStrategies = () => {
    if (!map || isZooming) return;

    const visibleElements = elements.filter(el => el.showLabel !== false);
    const labels = visibleElements.map(el => {
      const node = document.getElementById(el.id) as HTMLDivElement | null;
      return { el, node };
    }).filter(l => l.node);

    // Check if all expected elements are present in DOM
    const expectedElementCount = visibleElements.length;
    const foundElementCount = labels.length;
    if (foundElementCount < expectedElementCount) {
      setTimeout(() => {
        applyCollisionStrategies();
      }, 100);
      return;
    }

    const hasStrategies = visibleElements.some(el =>
      el.labelCollisionStrategy && el.labelCollisionStrategy !== 'None'
    );
    if (!hasStrategies) return;

    const labelNodes = new Map(labels.map(({ el, node }) => [el.id, node]));
    const newHiddenIds = new Set<string>();

    for (const [id, node] of labelNodes.entries()) {
      if (node) {
        const isCurrentlyVisible = node.style.display !== 'none';
        labelVisibility.current[id] = isCurrentlyVisible;
      }
    }

    // Calculate zoom-appropriate fuzz value with a minimum
    const currentZoom = map.getZoom();
    const baseFuzz = 48;
    const fuzz = Math.max(baseFuzz / Math.pow(2.5, currentZoom), 8);

    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i];
        const b = labels[j];
        if (!a.node || !b.node) continue;

        let rectA, rectB;
        try {
          rectA = a.node.getBoundingClientRect();
          rectB = b.node.getBoundingClientRect();
          rectA = {
            top: rectA.top - fuzz,
            left: rectA.left - fuzz,
            bottom: rectA.bottom + fuzz,
            right: rectA.right + fuzz
          };
          rectB = {
            top: rectB.top - fuzz,
            left: rectB.left - fuzz,
            bottom: rectB.bottom + fuzz,
            right: rectB.right + fuzz
          };
        } catch {
          continue;
        }

        const overlap = !(
          rectA.right < rectB.left ||
          rectA.left > rectB.right ||
          rectA.bottom < rectB.top ||
          rectA.top > rectB.bottom
        );

        if (overlap) {
          const stratA = a.el.labelCollisionStrategy || 'None';
          const stratB = b.el.labelCollisionStrategy || 'None';

          if (stratA === 'Hide' && stratB !== 'Hide') {
            newHiddenIds.add(a.el.id);
          } else if (stratB === 'Hide' && stratA !== 'Hide') {
            newHiddenIds.add(b.el.id);
          } else if (stratA === 'Hide' && stratB === 'Hide') {
            newHiddenIds.add(a.el.id);
            newHiddenIds.add(b.el.id);
          } else if (stratA === 'Conquer' && stratB !== 'Conquer') {
            newHiddenIds.add(b.el.id);
          } else if (stratB === 'Conquer' && stratA !== 'Conquer') {
            newHiddenIds.add(a.el.id);
          }
        }
      }
    }

    hiddenElements.current = newHiddenIds;

    labelNodes.forEach((node, id) => {
      if (!node) return;
      const shouldShow = !newHiddenIds.has(id);
      if (node && labelVisibility.current[id] !== shouldShow) {
        node.style.display = shouldShow ? '' : 'none';
        labelVisibility.current[id] = shouldShow;
      }
    });

    // Also apply to any elements that might be created later
    requestAnimationFrame(() => {
      newHiddenIds.forEach(id => {
        const node = document.getElementById(id) as HTMLDivElement | null;
        if (node && node.style.display !== 'none') {
          node.style.display = 'none';
          labelVisibility.current[id] = false;
        }
      });
    });
  };

  // Debounced version for performance
  const debouncedCollisionCheck = useMemo(
    () => debounce(applyCollisionStrategies, 100),
    [elements]
  );

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      if (!isZooming) {
        setTimeout(() => {
          debouncedCollisionCheck();
        }, 50);
      }
    };

    map.on('moveend', handleMoveEnd);

    // MutationObserver to watch for label DOM changes
    const mapContainer = document.querySelector('.leaflet-pane.leaflet-overlay-pane');
    if (mapContainer) {
      observerRef.current = new MutationObserver(() => {
        setTimeout(() => {
          debouncedCollisionCheck();
        }, 10);
      });
      observerRef.current.observe(mapContainer, { childList: true, subtree: true });
    }

    // Initial run
    setTimeout(() => {
      debouncedCollisionCheck();
    }, 50);

    return () => {
      map.off('moveend', handleMoveEnd);
      observerRef.current?.disconnect();
      debouncedCollisionCheck.cancel();
    };
  }, [map, isZooming, debouncedCollisionCheck, elements]);
} 