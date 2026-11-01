#!/usr/bin/env node
/**
 * Builds src/data/mission-boundaries.json from OpenStreetMap admin boundaries.
 *
 * The Church does not publish mission boundaries, so each mission is described
 * as the set of administrative areas (states, districts, etc.) it covers. This
 * script looks those areas up through Nominatim, merges them into one outline,
 * and writes a small bundled file the app reads offline.
 *
 * Run: npm run boundaries
 * Nominatim usage policy: at most 1 request per second, identify the app.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { featureCollection } from "@turf/helpers";
import { union } from "@turf/union";

const OUTPUT = fileURLToPath(
  new URL("../src/data/mission-boundaries.json", import.meta.url),
);
const USER_AGENT = "MissionMinded/1.0 (BYU CS 456 class project)";

// osm: OpenStreetMap relation IDs (find one by searching nominatim.openstreetmap.org).
// threshold: simplification in degrees. Bigger areas can use a coarser outline.
const missions = [
  {
    id: "alaska-anchorage",
    name: "Alaska Anchorage Mission",
    areas: [{ name: "Alaska", osm: 1116270 }],
    threshold: 0.02,
  },
  {
    id: "peru-lima-north",
    name: "Peru Lima North Mission",
    // The districts that make up Lima Norte.
    areas: [
      { name: "Ancón", osm: 1944676 },
      { name: "Carabayllo", osm: 1944701 },
      { name: "Comas", osm: 1944720 },
      { name: "Independencia", osm: 1944743 },
      { name: "Los Olivos", osm: 1944759 },
      { name: "Puente Piedra", osm: 1944788 },
      { name: "San Martín de Porres", osm: 1944821 },
      { name: "Santa Rosa", osm: 1944842 },
    ],
    threshold: 0.0005,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function lookupArea(osmId, threshold) {
  const url = new URL("https://nominatim.openstreetmap.org/lookup");
  url.search = new URLSearchParams({
    osm_ids: `R${osmId}`,
    format: "geojson",
    polygon_geojson: "1",
    polygon_threshold: String(threshold),
  }).toString();

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok)
    throw new Error(`Nominatim ${response.status} for relation ${osmId}`);
  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error(`No boundary found for relation ${osmId}`);
  return feature;
}

function mapPositions(geometry, fn) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => ring.map(fn)));
}

/** Shoelace area in square degrees. Only used to compare rings, so no projection needed. */
function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
}

/**
 * Rounds coordinates and keeps areas that cross the 180° line (like Alaska's
 * Aleutian Islands) on one side, so the bounding box stays compact.
 */
function normalizeGeometry(geometry, decimals) {
  const factor = 10 ** decimals;
  const round = (value) => Math.round(value * factor) / factor;
  const lons = mapPositions(geometry, ([lon]) => lon).flat(2);
  const crossesDateLine = Math.max(...lons) - Math.min(...lons) > 180;

  const polygons = mapPositions(geometry, ([lon, lat]) => [
    round(crossesDateLine && lon > 0 ? lon - 360 : lon),
    round(lat),
  ]);

  // Simplified neighbors don't share edges exactly, so merging leaves thin
  // slivers. Missions have no holes: keep outer rings and drop tiny fragments.
  const outerRings = polygons.map(([outer]) => outer);
  const largest = Math.max(...outerRings.map(ringArea));
  const coordinates = outerRings
    .filter((ring) => ringArea(ring) > largest * 1e-4)
    .map((ring) => [ring]);

  return { type: "MultiPolygon", coordinates };
}

function boundingBox(geometry) {
  const positions = geometry.coordinates.flat(2);
  const lons = positions.map(([lon]) => lon);
  const lats = positions.map(([, lat]) => lat);
  return [
    Math.min(...lons),
    Math.min(...lats),
    Math.max(...lons),
    Math.max(...lats),
  ];
}

async function buildMission(mission) {
  const features = [];
  for (const area of mission.areas) {
    console.log(`  ${area.name}`);
    features.push(await lookupArea(area.osm, mission.threshold));
    await sleep(1100);
  }

  const merged =
    features.length > 1 ? union(featureCollection(features)) : features[0];
  const decimals = mission.threshold >= 0.01 ? 3 : 4;
  const geometry = normalizeGeometry(merged.geometry, decimals);

  return {
    name: mission.name,
    areas: mission.areas.map((area) => area.name),
    approximate: true,
    bbox: boundingBox(geometry),
    geometry,
  };
}

const output = {
  source: "OpenStreetMap contributors via Nominatim (ODbL)",
  generatedAt: new Date().toISOString().slice(0, 10),
  missions: {},
};

for (const mission of missions) {
  console.log(mission.name);
  output.missions[mission.id] = await buildMission(mission);
}

await writeFile(OUTPUT, `${JSON.stringify(output)}\n`);
console.log(`Wrote ${OUTPUT}`);
