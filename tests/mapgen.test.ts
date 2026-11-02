import { describe, expect, it } from 'vitest';

import { generateMap, isSolid, mulberry32, tileIndex, TILE } from '../src/game/world/mapgen';

const SEED = 20261102;

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(SEED);
    const b = mulberry32(SEED);

    for (let i = 0; i < 20; i += 1) {
      expect(a()).toBe(b());
    }
  });

  it('produces values in [0, 1)', () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 500; i += 1) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateMap', () => {
  it('is reproducible from the seed', () => {
    expect(generateMap(SEED).solid).toEqual(generateMap(SEED).solid);
    expect(generateMap(SEED + 1).solid).not.toEqual(generateMap(SEED).solid);
  });

  it('has the expected grid dimensions', () => {
    const map = generateMap(SEED, 24, 18);

    expect(map.cols).toBe(24);
    expect(map.rows).toBe(18);
    expect(map.solid).toHaveLength(24 * 18);
  });

  it('walls off the entire border', () => {
    const map = generateMap(SEED, 24, 18);

    for (let col = 0; col < map.cols; col += 1) {
      expect(isSolid(map, col, 0)).toBe(true);
      expect(isSolid(map, col, map.rows - 1)).toBe(true);
    }
    for (let row = 0; row < map.rows; row += 1) {
      expect(isSolid(map, 0, row)).toBe(true);
      expect(isSolid(map, map.cols - 1, row)).toBe(true);
    }
  });

  it('leaves the spawn and NPC tiles walkable', () => {
    const map = generateMap(SEED);

    expect(isSolid(map, map.spawn.col, map.spawn.row)).toBe(false);
    expect(isSolid(map, map.npc.col, map.npc.row)).toBe(false);
    expect(map.npc.name).toBe('Clarence');
  });

  it('places the NPC at least 6 tiles from the spawn', () => {
    const map = generateMap(SEED);
    const distance = Math.abs(map.npc.col - map.spawn.col) + Math.abs(map.npc.row - map.spawn.row);

    expect(distance).toBeGreaterThanOrEqual(6);
  });

  it('treats out-of-bounds as solid', () => {
    const map = generateMap(SEED);

    expect(isSolid(map, -1, 5)).toBe(true);
    expect(isSolid(map, 5, -1)).toBe(true);
    expect(isSolid(map, map.cols, 5)).toBe(true);
    expect(isSolid(map, 5, map.rows)).toBe(true);
  });

  it('rejects maps that are too small', () => {
    expect(() => generateMap(SEED, 4, 4)).toThrow(/at least 8x8/);
  });

  it('never leaves the spawn clearing enclosed', () => {
    const map = generateMap(SEED);
    const { col, row } = map.spawn;

    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        expect(isSolid(map, col + dc, row + dr)).toBe(false);
      }
    }
  });
});

describe('tileIndex / TILE', () => {
  it('maps row-major offsets', () => {
    expect(tileIndex(0, 0, 10)).toBe(0);
    expect(tileIndex(3, 2, 10)).toBe(23);
  });

  it('keeps tile size a power of two', () => {
    expect(TILE).toBe(16);
  });
});
