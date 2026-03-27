// kiro-graph-data.js — nodes, links, initial positions
import { CENTER_POS, FIRST_RING_RADIUS, SECOND_RING_MIN, SECOND_RING_MAX } from './kiro-constants.js'

const deg = (d) => (d * Math.PI) / 180
const polar = (cx, cy, r, angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })

// v2: better spatial balance — upper-left, right, lower-center
// angles chosen so clusters fill the vertical canvas without overlap
const FIRST_ANGLES = [deg(210), deg(350), deg(115)]
const firstPos = FIRST_ANGLES.map((a) => polar(CENTER_POS.x, CENTER_POS.y, FIRST_RING_RADIUS, a))

// deterministic seed for reproducible jitter
let seed = 42
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}

function fanPositions(parent, baseAngle, count, spread = 45) {
  const startAngle = baseAngle - deg(spread * (count - 1) * 0.5)
  const r = (SECOND_RING_MIN + SECOND_RING_MAX) / 2
  return Array.from({ length: count }, (_, i) => {
    const a = startAngle + deg(spread * i)
    const jitter = 0.8 + seededRandom() * 0.4
    return polar(parent.x, parent.y, r * jitter, a)
  })
}

const aPos = fanPositions(firstPos[0], deg(210), 6, 26)
const bPos = fanPositions(firstPos[1], deg(350), 7, 22)
const cPos = fanPositions(firstPos[2], deg(115), 5, 28)

export const nodes = [
  { id: 'you', type: 'center', group: 0, ix: CENTER_POS.x, iy: CENTER_POS.y },
  { id: 'f1', type: 'first', group: 1, ix: firstPos[0].x, iy: firstPos[0].y },
  { id: 'f2', type: 'first', group: 2, ix: firstPos[1].x, iy: firstPos[1].y },
  { id: 'f3', type: 'first', group: 3, ix: firstPos[2].x, iy: firstPos[2].y },
  ...aPos.map((p, i) => ({ id: `a${i}`, type: 'second', group: 1, parent: 'f1', ix: p.x, iy: p.y })),
  ...bPos.map((p, i) => ({ id: `b${i}`, type: 'second', group: 2, parent: 'f2', ix: p.x, iy: p.y })),
  ...cPos.map((p, i) => ({ id: `c${i}`, type: 'second', group: 3, parent: 'f3', ix: p.x, iy: p.y })),
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
]
