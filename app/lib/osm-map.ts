/**
 * OSM tile URL from lat/lon - no API key required.
 * Returns a single tile (256x256) at zoom 17 for street-level map fallback.
 */

export function latLonToTile(lat: number, lon: number, z: number): { x: number; y: number; z: number } {
  const clampedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const latRad = (clampedLat * Math.PI) / 180;
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z };
}

/** Single OSM tile URL for given lat/lon at zoom 17 (street level) */
export function getOsmTileUrl(lat: number, lon: number, zoom = 17): string {
  const { x, y, z } = latLonToTile(lat, lon, zoom);
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}
