import type { MapElement, LabelDirection } from '@/types/elements';

/**
 * Calculate the offset for a label based on its alignment relative to the element
 * @param element - The map element
 * @param labelWidth - Width of the label in pixels
 * @param labelHeight - Height of the label in pixels
 * @returns [xOffset, yOffset] in coordinate units
 */
export function calculateLabelOffset(
    element: MapElement,
    labelWidth: number,
    labelHeight: number
  ): [number, number] {
    const direction = element.labelPosition?.direction || 'Center';
    const offset = element.labelPosition?.offset || 10.0;
    
    // Convert pixel dimensions to coordinate units (assuming 1 pixel = 0.1 coordinate units)
    const labelWidthCoord = labelWidth * 0.1;
    const labelHeightCoord = labelHeight * 0.1;
    
    // Calculate base offset based on direction
    // Note: Return format is [latOffset, lngOffset] to match applyLabelOffset
    let latOffset = 0; // Y-axis (vertical positioning)
    let lngOffset = 0; // X-axis (horizontal positioning)
    
    switch (direction) {
      case 'Center':
        lngOffset = -labelWidthCoord / 2;
        latOffset = labelHeightCoord + offset;  // FLIPPED: Center above
        break;
      case 'Left top':
        lngOffset = -labelWidthCoord - offset;  // Left = negative longitude
        latOffset = labelHeightCoord + offset;  // FLIPPED: Top = positive latitude
        break;
      case 'Mid top':
        lngOffset = -labelWidthCoord / 2;       // Center horizontally
        latOffset = labelHeightCoord + offset;  // FLIPPED: Top = positive latitude
        break;
      case 'Right top':
        lngOffset = offset;                     // Right = positive longitude
        latOffset = labelHeightCoord + offset;  // FLIPPED: Top = positive latitude
        break;
      case 'Left mid':
        lngOffset = -labelWidthCoord - offset;  // Left = negative longitude
        latOffset = labelHeightCoord / 2;       // FLIPPED: Center vertically
        break;
      case 'Right mid':
        lngOffset = offset;                     // Right = positive longitude
        latOffset = labelHeightCoord / 2;       // FLIPPED: Center vertically
        break;
      case 'Left bottom':
        lngOffset = -labelWidthCoord - offset;  // Left = negative longitude
        latOffset = -offset;                    // FLIPPED: Bottom = negative latitude
        break;
      case 'Mid bottom':
        lngOffset = -labelWidthCoord / 2;       // Center horizontally
        latOffset = -offset;                    // FLIPPED: Bottom = negative latitude
        break;
      case 'Right bottom':
        lngOffset = offset;                     // Right = positive longitude
        latOffset = -offset;                    // FLIPPED: Bottom = negative latitude
        break;
      default:
        lngOffset = -labelWidthCoord / 2;
        latOffset = labelHeightCoord + offset;  // FLIPPED: Default above
    }
    
    return [latOffset, lngOffset];
}

/**
 * Apply label offset to a position.
 * 
 * @param position - Original position [lat, lng]
 * @param offset - Offset to apply [latOffset, lngOffset]
 * @returns New position [lat, lng]
 */
export function applyLabelOffset(
  position: [number, number],
  offset: [number, number]
): [number, number] {
  const [lat, lng] = position;
  const [latOffset, lngOffset] = offset;
  
  const finalPosition: [number, number] = [lat + latOffset, lng + lngOffset];
  
  return finalPosition;
} 