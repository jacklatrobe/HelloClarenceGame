/** Tile edge length in pixels. Everything in the world grid is measured in tiles. */
export const TILE = 16;

// Deliberately larger than the 960x544 viewport so the camera has room to
// follow the player instead of being clamped to the world bounds.
export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 60;

export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

export interface GameMap {
  readonly cols: number;
  readonly rows: number;
  /** Row-major, length = cols * rows. true means the tile blocks movement. */
  readonly solid: readonly boolean[];
  readonly spawn: GridPoint;
  readonly npc: GridPoint & { readonly name: string };
}

/** Small, fast, deterministic PRNG so maps are reproducible from a seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tileIndex(col: number, row: number, cols: number): number {
  return row * cols + col;
}

export function inBounds(map: Pick<GameMap, 'cols' | 'rows'>, col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < map.cols && row < map.rows;
}

/** Out-of-bounds counts as solid, which keeps entity movement trivially safe. */
export function isSolid(map: GameMap, col: number, row: number): boolean {
  if (!inBounds(map, col, row)) return true;
  return map.solid[tileIndex(col, row, map.cols)] === true;
}

function manhattan(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/**
 * Builds a deterministic overworld: solid border, scattered rock clusters,
 * a guaranteed-walkable spawn clearing, and an NPC placed a few tiles away.
 */
export function generateMap(seed = 1, cols = DEFAULT_COLS, rows = DEFAULT_ROWS): GameMap {
  if (cols < 8 || rows < 8) {
    throw new Error(`Map must be at least 8x8 tiles, got ${cols}x${rows}`);
  }

  const rand = mulberry32(seed);
  const solid = new Array<boolean>(cols * rows).fill(false);

  const setSolid = (col: number, row: number, value: boolean): void => {
    if (!inBounds({ cols, rows }, col, row)) return;
    solid[tileIndex(col, row, cols)] = value;
  };

  for (let col = 0; col < cols; col += 1) {
    setSolid(col, 0, true);
    setSolid(col, rows - 1, true);
  }
  for (let row = 0; row < rows; row += 1) {
    setSolid(0, row, true);
    setSolid(cols - 1, row, true);
  }

  // Rock clusters rather than uniform noise, so the field reads as terrain.
  const clusterCount = Math.round((cols * rows) / 90);
  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    const originCol = 1 + Math.floor(rand() * (cols - 2));
    const originRow = 1 + Math.floor(rand() * (rows - 2));
    const size = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < size; i += 1) {
      const col = originCol + Math.floor(rand() * 3) - 1;
      const row = originRow + Math.floor(rand() * 3) - 1;
      setSolid(col, row, true);
    }
  }

  const spawn: GridPoint = { col: Math.floor(cols / 2), row: Math.floor(rows / 2) };

  const clearArea = (center: GridPoint, radius: number): void => {
    for (let row = center.row - radius; row <= center.row + radius; row += 1) {
      for (let col = center.col - radius; col <= center.col + radius; col += 1) {
        setSolid(col, row, false);
      }
    }
  };

  clearArea(spawn, 2);

  // Place Clarence on a walkable tile far enough away to require a walk.
  let npc: GridPoint = { col: spawn.col + 5, row: spawn.row };
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const candidate: GridPoint = {
      col: 2 + Math.floor(rand() * (cols - 4)),
      row: 2 + Math.floor(rand() * (rows - 4)),
    };
    if (manhattan(candidate, spawn) < 6) continue;
    if (solid[tileIndex(candidate.col, candidate.row, cols)] === true) continue;
    if (
      isSolid(
        { cols, rows, solid, spawn, npc: { ...candidate, name: '' } },
        candidate.col,
        candidate.row,
      )
    )
      continue;
    npc = candidate;
    break;
  }

  clearArea(npc, 1);

  // Re-assert the border: clearArea() never touches it, but be explicit.
  for (let col = 0; col < cols; col += 1) {
    setSolid(col, 0, true);
    setSolid(col, rows - 1, true);
  }
  for (let row = 0; row < rows; row += 1) {
    setSolid(0, row, true);
    setSolid(cols - 1, row, true);
  }

  return {
    cols,
    rows,
    solid,
    spawn,
    npc: { ...npc, name: 'Clarence' },
  };
}
