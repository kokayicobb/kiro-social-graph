// kiro-graph-data.js — v4: four rings of nodes
import {
  CENTER_POS, FIRST_RING_RADIUS,
  SECOND_RING_MIN, SECOND_RING_MAX,
  THIRD_RING_MIN, THIRD_RING_MAX,
  FOURTH_RING_MIN, FOURTH_RING_MAX,
} from './kiro-constants.js'

const deg = (d) => (d * Math.PI) / 180
const polar = (cx, cy, r, angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })

let seed = 42
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

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

// third-degree
const thirdDefs = [
  { parent: 'a0', parentPos: aPos[0], baseAngle: deg(200), count: 3 },
  { parent: 'a2', parentPos: aPos[2], baseAngle: deg(240), count: 3 },
  { parent: 'a4', parentPos: aPos[4], baseAngle: deg(190), count: 3 },
  { parent: 'a5', parentPos: aPos[5], baseAngle: deg(220), count: 3 },
  { parent: 'b0', parentPos: bPos[0], baseAngle: deg(340), count: 3 },
  { parent: 'b2', parentPos: bPos[2], baseAngle: deg(10), count: 3 },
  { parent: 'b3', parentPos: bPos[3], baseAngle: deg(350), count: 3 },
  { parent: 'b5', parentPos: bPos[5], baseAngle: deg(320), count: 3 },
  { parent: 'b6', parentPos: bPos[6], baseAngle: deg(0), count: 3 },
  { parent: 'c0', parentPos: cPos[0], baseAngle: deg(120), count: 4 },
  { parent: 'c2', parentPos: cPos[2], baseAngle: deg(140), count: 3 },
  { parent: 'c4', parentPos: cPos[4], baseAngle: deg(100), count: 3 },
]

const thirdNodes = []
const thirdLinks = []
let thirdIdx = 0
const thirdPositions = {} // store for fourth-ring parents
for (const def of thirdDefs) {
  const positions = fanPositions(def.parentPos, def.baseAngle, def.count, 35, THIRD_RING_MIN, THIRD_RING_MAX)
  for (let i = 0; i < def.count; i++) {
    const id = `t${thirdIdx}`
    const parentGroup = def.parent.startsWith('a') ? 1 : def.parent.startsWith('b') ? 2 : 3
    thirdNodes.push({ id, type: 'third', group: parentGroup, parent: def.parent, ix: positions[i].x, iy: positions[i].y })
    thirdLinks.push({ source: def.parent, target: id, phase: 'third-bloom' })
    thirdPositions[id] = positions[i]
    thirdIdx++
  }
}

// fourth-degree — bloom from ~10 third-degree nodes, 2-3 each = ~25 nodes
const fourthDefs = [
  { parent: 't0', baseAngle: deg(190), count: 2 },
  { parent: 't3', baseAngle: deg(250), count: 3 },
  { parent: 't6', baseAngle: deg(210), count: 2 },
  { parent: 't9', baseAngle: deg(230), count: 2 },
  { parent: 't12', baseAngle: deg(330), count: 3 },
  { parent: 't15', baseAngle: deg(10), count: 2 },
  { parent: 't18', baseAngle: deg(350), count: 3 },
  { parent: 't21', baseAngle: deg(310), count: 2 },
  { parent: 't24', baseAngle: deg(0), count: 2 },
  { parent: 't27', baseAngle: deg(130), count: 3 },
  { parent: 't30', baseAngle: deg(150), count: 2 },
  { parent: 't33', baseAngle: deg(90), count: 2 },
]

const fourthNodes = []
const fourthLinks = []
let fourthIdx = 0
for (const def of fourthDefs) {
  const pp = thirdPositions[def.parent]
  if (!pp) continue
  const positions = fanPositions(pp, def.baseAngle, def.count, 40, FOURTH_RING_MIN, FOURTH_RING_MAX)
  const parentNode = thirdNodes.find((n) => n.id === def.parent)
  for (let i = 0; i < def.count; i++) {
    const id = `q${fourthIdx}`
    fourthNodes.push({ id, type: 'fourth', group: parentNode?.group || 0, parent: def.parent, ix: positions[i].x, iy: positions[i].y })
    fourthLinks.push({ source: def.parent, target: id, phase: 'fourth-bloom' })
    fourthIdx++
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
  ...fourthNodes,
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
  ...fourthLinks,
]

export const COUNTS = {
  f1Friends: 6,
  f2Friends: 7,
  f3Friends: 5,
  preDropTotal: 1 + 3 + 18,
  finalTotal: 1 + 3 + 18 + thirdNodes.length + fourthNodes.length,
}
