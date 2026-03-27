// kiro-render.js — svg rendering layer
import {
  WIDTH, HEIGHT, BG_COLOR, NODE_COLOR, EDGE_COLOR, ACCENT_COLOR,
  LABEL_COLOR, COUNT_COLOR, RADII, EDGE_WIDTH, GLOW_STD_DEV, GLOW_OPACITY,
  FONT, LABEL_SIZE, COUNT_SIZE,
} from './kiro-constants.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs = {}) => {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

export function renderGraph({ nodes, links }) {
  const svg = el('svg', { width: WIDTH, height: HEIGHT, viewBox: `0 0 ${WIDTH} ${HEIGHT}` })
  document.getElementById('kiro-app').appendChild(svg)

  const defs = el('defs')
  defs.innerHTML = `
    <filter id="kiro-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${GLOW_STD_DEV}" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GLOW_OPACITY} 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="kiro-accent-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0" result="glow"/>
      <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `
  svg.appendChild(defs)

  svg.appendChild(el('rect', { width: WIDTH, height: HEIGHT, fill: BG_COLOR }))

  const edgeGroup = el('g', { class: 'kiro-edges' })
  const nodeGroup = el('g', { class: 'kiro-nodes' })
  const labelGroup = el('g', { class: 'kiro-labels' })
  svg.appendChild(edgeGroup)
  svg.appendChild(nodeGroup)
  svg.appendChild(labelGroup)

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  const edgeEls = links.map((link) => {
    const s = typeof link.source === 'object' ? link.source : nodeMap[link.source]
    const t = typeof link.target === 'object' ? link.target : nodeMap[link.target]
    const line = el('line', {
      x1: s.x, y1: s.y, x2: t.x, y2: t.y,
      stroke: EDGE_COLOR, 'stroke-width': EDGE_WIDTH, 'stroke-linecap': 'round',
      opacity: 0, class: `kiro-edge kiro-edge-${link.phase}`,
      'data-phase': link.phase,
    })
    const len = Math.hypot(t.x - s.x, t.y - s.y)
    line.setAttribute('stroke-dasharray', len)
    line.setAttribute('stroke-dashoffset', len)
    edgeGroup.appendChild(line)
    return { el: line, data: link, length: len }
  })

  const nodeEls = nodes.map((node) => {
    const r = RADII[node.type]
    const fill = node.type === 'first' ? ACCENT_COLOR : NODE_COLOR
    const circle = el('circle', {
      cx: node.x, cy: node.y, r,
      fill, opacity: 0, class: `kiro-node kiro-node-${node.type}`,
      'data-id': node.id, 'data-type': node.type, 'data-group': node.group,
    })
    if (node.type === 'center') circle.setAttribute('filter', 'url(#kiro-glow)')
    if (node.type === 'first') circle.setAttribute('filter', 'url(#kiro-accent-glow)')
    circle.setAttribute('transform', `translate(${node.x},${node.y}) scale(0) translate(${-node.x},${-node.y})`)
    nodeGroup.appendChild(circle)
    return { el: circle, data: node }
  })

  // "you" label
  const youNode = nodeMap['you']
  const youLabel = el('text', {
    x: youNode.x, y: youNode.y + RADII.center + 26,
    fill: LABEL_COLOR, 'font-family': FONT, 'font-size': LABEL_SIZE,
    'font-weight': '300', 'text-anchor': 'middle', 'letter-spacing': '3',
    opacity: 0, class: 'kiro-label kiro-label-you',
  })
  youLabel.textContent = 'you'
  labelGroup.appendChild(youLabel)

  // v2: count callouts — positioned closer to the action
  // first count: near f1's cluster
  const f1 = nodeMap['f1']
  const countFirst = el('text', {
    x: f1.x, y: f1.y - 50,
    fill: COUNT_COLOR, 'font-family': FONT, 'font-size': COUNT_SIZE,
    'font-weight': '400', 'text-anchor': 'middle', 'letter-spacing': '1',
    opacity: 0, class: 'kiro-count kiro-count-first',
  })
  countFirst.textContent = '+7 reachable'
  labelGroup.appendChild(countFirst)

  // full count: below the graph center, not too far
  const allY = nodes.map((n) => n.y)
  const maxY = Math.max(...allY)
  const countFull = el('text', {
    x: WIDTH / 2, y: maxY + 80,
    fill: COUNT_COLOR, 'font-family': FONT, 'font-size': COUNT_SIZE + 2,
    'font-weight': '400', 'text-anchor': 'middle', 'letter-spacing': '1.5',
    opacity: 0, class: 'kiro-count kiro-count-full',
  })
  countFull.textContent = '22 people reachable'
  labelGroup.appendChild(countFull)

  return { svg, edgeEls, nodeEls, youLabel, countFirst, countFull, nodeMap }
}
