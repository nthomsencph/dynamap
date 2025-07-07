/**
 * Extracts the first background color value found in a span element within given HTML.
 * Assumes inline styles using `background-color`.
 * 
 * @param html - the raw HTML string to parse
 * @returns background color string (e.g. '#ffcc00') or null
 */
export function extractBackgroundColorFromHTML(html: string): string | null {
  if (!html) return null;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Find any span with background color in the content
  const spanWithBg = tempDiv.querySelector('span[style*="background-color"]');
  if (!spanWithBg) return 'transparent';
  
  const bgColor = spanWithBg.getAttribute('style')?.match(/background-color:\s*([^;]+)/)?.[1];
  return bgColor || 'transparent';
}
  