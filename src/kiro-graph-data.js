// kiro-graph-data.js — v3: three rings of nodes with parent refs
import {
  CENTER_POS, FIRST_RING_RADIUS,
  SECOND_RING_MIN, SECOND_RING_MAX,
  THIRD_RING_MIN, THIRD_RING_MAX,
} from './kiro-constants.js'

const deg = (d) => (d * Math.PI) / 180
const polar = (cx, cy, r, angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })

// seeded PRNG
let seed = 42
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

// first-degree: asymmetric triangle
const FIRST_ANGLES = [deg(210), deg(350), deg(115)]
const firstPos = FIRST_ANGLES.map((a) => polar(CENTER_POS.x, CENTER_POS.y, FIRST_RING_RADIUS, a))

function fanPositions(parent, baseAngle, count, spread, rMin, rMax) {
  const start = baseAngle - deg(spread * (count - 1) * 0.5)
  const rMid = (rMin + rMax) / 2
  return Array.from({ length: count }, (_, i) => {
    const a = start + deg(spread * i)
    const jitter = 0.8 + rand() * 0.4
    return polar(parent.x, parent.y, rMid * jitter, a)
  })
}

// second-degree fans
const aPos = fanPositions(firstPos[0], deg(210), 6, 26, SECOND_RING_MIN, SECOND_RING_MAX)
const bPos = fanPositions(firstPos[1], deg(350), 7, 22, SECOND_RING_MIN, SECOND_RING_MAX)
const cPos = fanPositions(firstPos[2], deg(115), 5, 28, SECOND_RING_MIN, SECOND_RING_MAX)

// third-degree: select second-degree nodes to bloom from
// from f1's cluster: a0, a2, a4, a5 bloom (4 nodes, 3 each = 12)
// from f2's cluster: b0, b2, b3, b5, b6 bloom (5 nodes, 3 each = 15)
// from f3's cluster: c0, c2, c4 bloom (3 nodes, 3-4 each = 10)
// total third: ~37

const thirdDefs = [
  // from a-cluster
  { parent: 'a0', parentPos: aPos[0], baseAngle: deg(200), count: 3 },
  { parent: 'a2', parentPos: aPos[2], baseAngle: deg(240), count: 3 },
  { parent: 'a4', parentPos: aPos[4], baseAngle: deg(190), count: 3 },
  { parent: 'a5', parentPos: aPos[5], baseAngle: deg(220), count: 3 },
  // from b-cluster
  { parent: 'b0', parentPos: bPos[0], baseAngle: deg(340), count: 3 },
  { parent: 'b2', parentPos: bPos[2], baseAngle: deg(10), count: 3 },
  { parent: 'b3', parentPos: bPos[3], baseAngle: deg(350), count: 3 },
  { parent: 'b5', parentPos: bPos[5], baseAngle: deg(320), count: 3 },
  { parent: 'b6', parentPos: bPos[6], baseAngle: deg(0), count: 3 },
  // from c-cluster
  { parent: 'c0', parentPos: cPos[0], baseAngle: deg(120), count: 4 },
  { parent: 'c2', parentPos: cPos[2], baseAngle: deg(140), count: 3 },
  { parent: 'c4', parentPos: cPos[4], baseAngle: deg(100), count: 3 },
]

const thirdNodes = []
const thirdLinks = []
let thirdIdx = 0
for (const def of thirdDefs) {
  const positions = fanPositions(def.parentPos, def.baseAngle, def.count, 35, THIRD_RING_MIN, THIRD_RING_MAX)
  for (let i = 0; i < def.count; i++) {
    const id = `t${thirdIdx}`
    const parentGroup = def.parent.startsWith('a') ? 1 : def.parent.startsWith('b') ? 2 : 3
    thirdNodes.push({ id, type: 'third', group: parentGroup, parent: def.parent, ix: positions[i].x, iy: positions[i].y })
    thirdLinks.push({ source: def.parent, target: id, phase: 'third-bloom' })
    thirdIdx++
  }
}

export const nodes = [
  { id: 'you', type: 'center', group: 0, ix: CENTER_POS.x, iy: CENTER_POS.y },
  { id: 'f1', type: 'first', group: 1, ix: firstPos[0].x, iy: firstPos[0].y },
  { id: 'f2', type: 'first', group: 2, ix: firstPos[1].x, iy: firstPos[1].y },
  { id: 'f3', type: 'first', group: 3, ix: firstPos[2].x, iy: firstPos[2].y },
  ...aPos.map((p, i) => ({ id: `a${i}`, type: 'second', group: 1, parent: 'f1', ix: p.x, iy: p.y })),
  ...bPos.map((p, i) => ({ id: `b${i}`, type: 'second', group: 2, parent: 'f2', ix: p.x, iy: p.y })),
  ...cPos.map((p, i) => ({ id: `c${i}`, type: 'second', group: 3, parent: 'f3', ix: p.x, iy: p.y })),
  ...thirdNodes,
]

export const links = [
  { source: 'you', target: 'f1', phase: 'first-connect' },
  { source: 'you', target: 'f2', phase: 'second-connect' },
  { source: 'you', target: 'f3', phase: 'second-connect' },
  ...aPos.map((_, i) => ({ source: 'f1', target: `a${i}`, phase: 'first-bloom' })),
  ...bPos.map((_, i) => ({ source: 'f2', target: `b${i}`, phase: 'full-bloom' })),
  ...cPos.map((_, i) => ({ source: 'f3', target: `c${i}`, phase: 'full-bloom' })),
  { source: 'a3', target: 'b1', phase: 'full-bloom' },
  { source: 'b5', target: 'c0', phase: 'full-bloom' },
  ...thirdLinks,
]

// export counts for callouts
export const COUNTS = {
  firstBloom: 7,  // 1 friend + 6 in their group
  preDropTotal: 1 + 3 + 18, // you + first + second
  finalTotal: 1 + 3 + 18 + thirdNodes.length,
  thirdCount: thirdNodes.length,
}
