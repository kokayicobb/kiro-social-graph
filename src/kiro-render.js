// kiro-render.js — v3: red center, emerge positioning, equations, shimmer
import {
  WIDTH, HEIGHT, BG_COLOR, CENTER_COLOR, FIRST_COLOR, SECOND_COLOR, THIRD_COLOR,
  EDGE_COLOR, LABEL_COLOR, EQUATION_COLOR, ACCENT_COLOR,
  RADII, EDGE_WIDTH, GLOW_STD_DEV, GLOW_OPACITY,
  FONT, LABEL_SIZE, EQUATION_SIZE, EQUATION_SMALL,
} from './kiro-constants.js'
import { COUNTS } from './kiro-graph-data.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs = {}) => {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

const NODE_COLORS = { center: CENTER_COLOR, first: FIRST_COLOR, second: SECOND_COLOR, third: THIRD_COLOR }

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
    <filter id="kiro-white-glow" x="-50%" y="-50%" width="200%" height="200%">
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

  // edges
  const edgeEls = links.map((link) => {
    const s = typeof link.source === 'object' ? link.source : nodeMap[link.source]
    const t = typeof link.target === 'object' ? link.target : nodeMap[link.target]
    const tier = link.phase === 'first-connect' || link.phase === 'second-connect' ? 'first'
      : link.phase === 'third-bloom' ? 'third' : 'second'
    const line = el('line', {
      x1: s.x, y1: s.y, x2: t.x, y2: t.y,
      stroke: EDGE_COLOR, 'stroke-width': EDGE_WIDTH[tier], 'stroke-linecap': 'round',
      opacity: 0, class: `kiro-edge kiro-edge-${link.phase}`,
      'data-phase': link.phase, 'data-tier': tier,
    })
    const len = Math.hypot(t.x - s.x, t.y - s.y)
    line.setAttribute('stroke-dasharray', len)
    line.setAttribute('stroke-dashoffset', len)
    edgeGroup.appendChild(line)
    return { el: line, data: link, length: len, tier }
  })

  // nodes — second/third degree start at parent position for emerge
  const nodeEls = nodes.map((node) => {
    const r = RADII[node.type]
    const fill = NODE_COLORS[node.type]
    const parentNode = node.parent ? nodeMap[node.parent] : null
    const startX = parentNode ? parentNode.x : node.x
    const startY = parentNode ? parentNode.y : node.y

    const circle = el('circle', {
      cx: startX, cy: startY, r: 0,
      fill, opacity: 0, class: `kiro-node kiro-node-${node.type}`,
      'data-id': node.id, 'data-type': node.type, 'data-group': node.group,
    })
    if (node.type === 'center') circle.setAttribute('filter', 'url(#kiro-glow)')
    if (node.type === 'first') circle.setAttribute('filter', 'url(#kiro-white-glow)')
    nodeGroup.appendChild(circle)
    return { el: circle, data: node, parentNode }
  })

  // "you" label
  const youNode = nodeMap['you']
  const youLabel = el('text', {
    x: youNode.x, y: youNode.y + RADII.center + 28,
    fill: LABEL_COLOR, 'font-family': FONT, 'font-size': LABEL_SIZE,
    'font-weight': '300', 'text-anchor': 'middle', 'letter-spacing': '3',
    opacity: 0, class: 'kiro-label kiro-label-you',
  })
  youLabel.textContent = 'you'
  labelGroup.appendChild(youLabel)

  // equation callout: first bloom — "+1 friend" / "+6 friend group"
  const f1 = nodeMap['f1']
  const eq1Line1 = el('text', {
    x: f1.x, y: f1.y - 55,
    fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': EQUATION_SMALL,
    'font-weight': '400', 'text-anchor': 'middle', 'letter-spacing': '0.5',
    opacity: 0, class: 'kiro-eq kiro-eq-first-1',
  })
  eq1Line1.textContent = '+1 friend'
  labelGroup.appendChild(eq1Line1)

  const eq1Line2 = el('text', {
    x: f1.x, y: f1.y - 36,
    fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': EQUATION_SMALL,
    'font-weight': '300', 'text-anchor': 'middle', 'letter-spacing': '0.5',
    opacity: 0, class: 'kiro-eq kiro-eq-first-2',
  })
  eq1Line2.textContent = '+6 friend group'
  labelGroup.appendChild(eq1Line2)

  // equation callout: pause (pre-drop)
  const eqPause = el('text', {
    x: WIDTH / 2, y: HEIGHT * 0.82,
    fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': EQUATION_SIZE,
    'font-weight': '400', 'text-anchor': 'middle', 'letter-spacing': '1',
    opacity: 0, class: 'kiro-eq kiro-eq-pause',
  })
  eqPause.textContent = `+3 friends = ${COUNTS.preDropTotal - 1} connections`
  labelGroup.appendChild(eqPause)

  // equation callout: final (post-drop)
  const eqFinal = el('text', {
    x: WIDTH / 2, y: HEIGHT * 0.82,
    fill: ACCENT_COLOR, 'font-family': FONT, 'font-size': EQUATION_SIZE + 2,
    'font-weight': '500', 'text-anchor': 'middle', 'letter-spacing': '1.5',
    opacity: 0, class: 'kiro-eq kiro-eq-final',
  })
  eqFinal.textContent = `+3 friends = ${COUNTS.finalTotal - 1} connections`
  labelGroup.appendChild(eqFinal)

  return { svg, edgeEls, nodeEls, youLabel, eq1Line1, eq1Line2, eqPause, eqFinal, nodeMap }
}
