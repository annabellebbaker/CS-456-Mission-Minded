import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getFirebaseFirestore } from '@/data/firebase';
import { getMissionRegion } from '@/data/mission-regions';
import { getMissionBoundary, type MissionBoundary } from '@/data/repository';

/**
 * Loads a mission's boundary for any mission, not just the ones bundled in
 * mission-boundaries.json. Lookup order, fastest first:
 *   1. bundled JSON (hand-curated outlines, works offline)
 *   2. in-memory cache for this session
 *   3. AsyncStorage cache on this device
 *   4. shared Firestore cache at missionBoundaries/{id}
 *   5. OpenStreetMap Nominatim, built from the mission's name, then saved to 2–4
 * Nominatim asks apps to cache results and send at most 1 request per second.
 */

const CACHE_VERSION = 'v1';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MissionMinded/1.0 (BYU CS 456 class project)';
/** Firestore documents cap at 1 MiB; leave headroom. */
const MAX_FIRESTORE_GEOMETRY_CHARS = 700_000;

const memoryCache = new Map<string, MissionBoundary | null>();
const inFlight = new Map<string, Promise<MissionBoundary | null>>();
let lastNominatimRequest = 0;

const DIRECTION_WORDS = new Set([
  'north', 'south', 'east', 'west', 'central',
  'northeast', 'northwest', 'southeast', 'southwest',
  'norte', 'sur', 'este', 'oeste', 'centro', 'nord', 'sud', 'ouest', 'est',
]);

export type BoundaryState =
  | { status: 'loading'; boundary?: undefined }
  | { status: 'ready'; boundary: MissionBoundary }
  | { status: 'unavailable'; boundary?: undefined };

export function getBoundaryKey(missionId: string, missionName: string): string {
  const id = missionId.trim();
  if (id) return id;
  return missionName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\bmission\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "Japan Tokyo South Mission" → ["Japan Tokyo", "Japan"]: most specific place first, then the region. */
export function buildBoundaryQueries(missionName: string): string[] {
  const words = missionName
    .replace(/\bmission\b/gi, '')
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const place = words.filter((word) => !DIRECTION_WORDS.has(word.toLowerCase()) && !/^\d+$/.test(word));
  const queries = [place.join(' ')];
  // Mission names lead with the state or country. If the city can't be found, outline that instead.
  const region = getMissionRegion(missionName);
  if (region) queries.push(region.replace(/\b\w/g, (letter) => letter.toUpperCase()));
  return [...new Set(queries.filter(Boolean))];
}

type Position = [number, number];
type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }
  | { type: string; coordinates?: unknown };

function ringArea(ring: Position[]) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(sum / 2);
}

function ringBox(ring: Position[]): [number, number, number, number] {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/** Same cleanup as scripts/fetch-mission-boundaries.mjs so live and bundled maps look alike. */
function normalizeGeometry(geometry: GeoJsonGeometry): MissionBoundary['geometry'] | null {
  let polygons: Position[][][];
  if (geometry.type === 'Polygon') polygons = [geometry.coordinates as Position[][]];
  else if (geometry.type === 'MultiPolygon') polygons = geometry.coordinates as Position[][][];
  else return null;

  const lons = polygons.flat(2).map(([lon]) => lon);
  const crossesDateLine = Math.max(...lons) - Math.min(...lons) > 180;
  const round = (value: number) => Math.round(value * 10_000) / 10_000;

  const outerRings = polygons
    .map(([outer]) => outer.map(([lon, lat]) => [round(crossesDateLine && lon > 0 ? lon - 360 : lon), round(lat)] as Position))
    .filter((ring) => ring.length >= 4);
  if (!outerRings.length) return null;
  const areas = outerRings.map(ringArea);
  const largestRing = outerRings[areas.indexOf(Math.max(...areas))];
  const largest = Math.max(...areas);
  // Keep the main landmass and pieces near it. Far-off islands (like Tokyo's
  // Ogasawara chain) would otherwise zoom the map out to mostly ocean.
  const [minLon, minLat, maxLon, maxLat] = ringBox(largestRing);
  const padLon = Math.max(maxLon - minLon, 0.2);
  const padLat = Math.max(maxLat - minLat, 0.2);
  const coordinates = outerRings
    .filter((ring, index) => {
      if (ring === largestRing) return true;
      if (areas[index] <= largest * 1e-4) return false;
      const [lon, lat] = ring[0];
      return lon >= minLon - padLon && lon <= maxLon + padLon && lat >= minLat - padLat && lat <= maxLat + padLat;
    })
    .map((ring) => [ring]);
  return { type: 'MultiPolygon', coordinates };
}

function boundingBox(geometry: MissionBoundary['geometry']): MissionBoundary['bbox'] {
  const positions = geometry.coordinates.flat(2);
  const lons = positions.map(([lon]) => lon);
  const lats = positions.map(([, lat]) => lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

async function waitForNominatimSlot() {
  const wait = lastNominatimRequest + 1100 - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimRequest = Date.now();
}

async function fetchFromNominatim(missionName: string): Promise<MissionBoundary | null> {
  for (const query of buildBoundaryQueries(missionName)) {
    await waitForNominatimSlot();
    const url = `${NOMINATIM_URL}?${new URLSearchParams({
      q: query,
      format: 'geojson',
      polygon_geojson: '1',
      polygon_threshold: '0.005',
      limit: '5',
    }).toString()}`;
    // Browsers forbid setting User-Agent; they send a Referer instead, which Nominatim accepts.
    const response = await fetch(url, Platform.OS === 'web' ? undefined : { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) continue;
    const data = await response.json() as {
      features?: { geometry: GeoJsonGeometry; properties?: { display_name?: string; name?: string } }[];
    };
    // Skip point results (like a single address) and take the first real area.
    const feature = data.features?.find((item) => item.geometry.type === 'Polygon' || item.geometry.type === 'MultiPolygon');
    if (!feature) continue;
    const geometry = normalizeGeometry(feature.geometry);
    if (!geometry) continue;
    const areaName = feature.properties?.name || feature.properties?.display_name?.split(',')[0] || query;
    return {
      name: /mission$/i.test(missionName.trim()) ? missionName.trim() : `${missionName.trim()} Mission`,
      areas: [areaName],
      approximate: true,
      bbox: boundingBox(geometry),
      geometry,
    };
  }
  return null;
}

function isBoundary(value: unknown): value is MissionBoundary {
  const item = value as MissionBoundary | null;
  return !!item && typeof item.name === 'string' && Array.isArray(item.bbox) && item.geometry?.type === 'MultiPolygon';
}

async function readDeviceCache(key: string): Promise<MissionBoundary | null> {
  try {
    const stored = await AsyncStorage.getItem(`missionBoundary:${CACHE_VERSION}:${key}`);
    const parsed = stored ? JSON.parse(stored) : null;
    return isBoundary(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeDeviceCache(key: string, boundary: MissionBoundary) {
  await AsyncStorage.setItem(`missionBoundary:${CACHE_VERSION}:${key}`, JSON.stringify(boundary)).catch(() => undefined);
}

// Firestore can't hold nested arrays, so the geometry is stored as a JSON string.
async function readSharedCache(key: string): Promise<MissionBoundary | null> {
  try {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), 'missionBoundaries', key));
    const value = snapshot.data();
    if (!value || typeof value.geometry !== 'string') return null;
    const boundary = {
      name: value.name,
      areas: Array.isArray(value.areas) ? value.areas : [],
      approximate: value.approximate !== false,
      bbox: value.bbox,
      geometry: JSON.parse(value.geometry),
    };
    return isBoundary(boundary) ? boundary : null;
  } catch {
    return null;
  }
}

async function writeSharedCache(key: string, boundary: MissionBoundary) {
  const geometry = JSON.stringify(boundary.geometry);
  if (geometry.length > MAX_FIRESTORE_GEOMETRY_CHARS) return;
  try {
    await setDoc(doc(getFirebaseFirestore(), 'missionBoundaries', key), {
      name: boundary.name,
      areas: boundary.areas,
      approximate: boundary.approximate,
      bbox: boundary.bbox,
      geometry,
      source: 'OpenStreetMap contributors via Nominatim (ODbL)',
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Firestore rules may not allow this write yet. The device cache still works.
  }
}

/** Resolves a boundary for any mission. Returns null when no outline can be found. */
export function loadMissionBoundary(missionId: string, missionName: string): Promise<MissionBoundary | null> {
  const key = getBoundaryKey(missionId, missionName);
  const bundled = getMissionBoundary(missionId);
  if (bundled) return Promise.resolve(bundled);
  if (!key || !missionName.trim()) return Promise.resolve(null);
  if (memoryCache.has(key)) return Promise.resolve(memoryCache.get(key) ?? null);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const cached = await readDeviceCache(key) ?? await readSharedCache(key);
    if (cached) {
      void writeDeviceCache(key, cached);
      return cached;
    }
    const fetched = await fetchFromNominatim(missionName).catch(() => null);
    if (fetched) {
      void writeDeviceCache(key, fetched);
      void writeSharedCache(key, fetched);
    }
    return fetched;
  })().then((boundary) => {
    memoryCache.set(key, boundary);
    inFlight.delete(key);
    return boundary;
  });
  inFlight.set(key, request);
  return request;
}

/** React hook: the mission boundary for a missionary, loaded on demand. */
export function useMissionBoundary(missionId: string, missionName: string): BoundaryState {
  const bundled = getMissionBoundary(missionId);
  const key = getBoundaryKey(missionId, missionName);
  const [state, setState] = useState<{ key: string; value: BoundaryState } | null>(null);

  useEffect(() => {
    if (bundled) return;
    let active = true;
    void loadMissionBoundary(missionId, missionName).then((boundary) => {
      if (!active) return;
      setState({ key, value: boundary ? { status: 'ready', boundary } : { status: 'unavailable' } });
    });
    return () => {
      active = false;
    };
  }, [bundled, key, missionId, missionName]);

  if (bundled) return { status: 'ready', boundary: bundled };
  if (!missionName.trim() || /not yet known/i.test(missionName)) return { status: 'unavailable' };
  return state?.key === key ? state.value : { status: 'loading' };
}
