/** V2 data contracts only. No purchase, currency, leveling, or paid services. */
export const KEEPSAKE_VERSION = 1;

export function createBouquetDraft() {
  return { version: KEEPSAKE_VERSION, stems: [], wrapping: { color: '#f2d8cd', ribbon: '#bd7c8d' } };
}

// A stem will be { flowerId, position: [x,y,z], rotation: [x,y,z], scale }.
// Resolve flowerId against flowerById when importing a future saved bouquet.
export function createCardDraft() {
  return { version: KEEPSAKE_VERSION, recipient: '', message: '', sender: '', palette: 'blush' };
}

export const exportCapabilities = Object.freeze({
  png: { planned: true, browserAPI: 'HTMLCanvasElement.toBlob' },
  video: { planned: true, browserAPI: 'HTMLCanvasElement.captureStream + MediaRecorder', requiresFeatureDetection: true },
});
