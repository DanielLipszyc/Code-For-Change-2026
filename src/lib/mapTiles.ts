/**
 * The base map. OpenStreetMap's standard tiles are free for light use with
 * attribution (https://operations.osmfoundation.org/policies/tiles/). If
 * traffic grows past that, switch these to a tile provider's URL.
 *
 * One host, no a/b/c subdomains: OSM serves tiles over HTTP/2 and recommends
 * a single hostname, so the browser reuses one connection.
 */
export const TILE_ORIGIN = "https://tile.openstreetmap.org";
export const TILE_URL = `${TILE_ORIGIN}/{z}/{x}/{y}.png`;
export const TILE_ATTRIBUTION = "© OpenStreetMap contributors";
