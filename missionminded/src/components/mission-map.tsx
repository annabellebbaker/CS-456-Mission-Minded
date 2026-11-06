import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText as Text } from '@/components/app-text';
import type { MissionBoundary } from '@/data/repository';
import { colors, spacing } from '@/theme/colors';

const TILE_SIZE = 256;
const MAX_ZOOM = 14;
const PADDING = 20;
// OpenStreetMap's standard tiles need no key but are only for light use with attribution
// (https://operations.osmfoundation.org/policies/tiles/). Swap in a keyed provider before launch.
const tileUrl = (z: number, x: number, y: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** Web Mercator: degrees to pixels at zoom 0 (the world is one 256px tile). */
function project(lon: number, lat: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * TILE_SIZE,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE_SIZE,
  };
}

function layoutMap(boundary: MissionBoundary, width: number, height: number) {
  const [west, south, east, north] = boundary.bbox;
  const topLeft = project(west, north);
  const bottomRight = project(east, south);

  // Fit the whole boundary inside the padded frame, at a fractional zoom.
  const zoom = Math.min(
    MAX_ZOOM,
    Math.log2((width - PADDING * 2) / (bottomRight.x - topLeft.x)),
    Math.log2((height - PADDING * 2) / (bottomRight.y - topLeft.y)),
  );
  const tileZoom = Math.max(0, Math.ceil(zoom));
  const scale = 2 ** zoom;
  const tileSize = TILE_SIZE * 2 ** (zoom - tileZoom);

  // Pixel position of the frame's top-left corner in the scaled world.
  const originX = ((topLeft.x + bottomRight.x) / 2) * scale - width / 2;
  const originY = ((topLeft.y + bottomRight.y) / 2) * scale - height / 2;

  const tileCount = 2 ** tileZoom;
  const tiles = [];
  for (let tx = Math.floor(originX / tileSize); tx * tileSize < originX + width; tx++) {
    for (let ty = Math.max(0, Math.floor(originY / tileSize)); ty * tileSize < originY + height && ty < tileCount; ty++) {
      const wrappedX = ((tx % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${tx}-${ty}`,
        uri: tileUrl(tileZoom, wrappedX, ty),
        left: tx * tileSize - originX,
        top: ty * tileSize - originY,
      });
    }
  }

  const path = boundary.geometry.coordinates
    .flat()
    .map((ring) =>
      ring
        .map(([lon, lat], index) => {
          const point = project(lon, lat);
          const x = point.x * scale - originX;
          const y = point.y * scale - originY;
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join('') + 'Z',
    )
    .join('');

  return { tiles, tileSize, path };
}

/** Shows a mission's outline on a basemap, fitted to whatever width it is given. */
export function MissionMap({ boundary, height = 220 }: { boundary: MissionBoundary; height?: number }) {
  const [width, setWidth] = useState(0);
  const map = width > 0 ? layoutMap(boundary, width, height) : null;

  const handleLayout = (event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Map of the ${boundary.name}, covering ${boundary.areas.join(', ')}`}
      onLayout={handleLayout}
      style={[styles.frame, { height }]}>
      {map && (
        <>
          {map.tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.uri }}
              transition={150}
              style={[styles.tile, { left: tile.left, top: tile.top, width: map.tileSize, height: map.tileSize }]}
            />
          ))}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path
              d={map.path}
              fill={colors.lightBlue}
              fillOpacity={0.22}
              fillRule="evenodd"
              stroke={colors.navy}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
        </>
      )}
      <View style={styles.label}>
        <Text style={styles.labelText}>{boundary.name}</Text>
        {boundary.approximate && <Text style={styles.labelNote}>Approximate boundary</Text>}
      </View>
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D6DEE6',
    borderRadius: 12,
    backgroundColor: '#EAF2F8',
  },
  tile: { position: 'absolute' },
  label: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  labelText: { color: colors.navy, fontSize: 12, fontWeight: '600' },
  labelNote: { color: colors.textSecondary, fontSize: 10 },
  attribution: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    color: colors.textSecondary,
    fontSize: 9,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
});
