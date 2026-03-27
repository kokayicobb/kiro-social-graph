// kiro-render.js — v4: callouts for all 3 nodes, bigger equation, fourth ring
import {
  WIDTH, HEIGHT, BG_COLOR, CENTER_COLOR, FIRST_COLOR, SECOND_COLOR, THIRD_COLOR, FOURTH_COLOR,
  EDGE_COLOR, LABEL_COLOR, EQUATION_COLOR, ACCENT_COLOR,
  RADII, EDGE_WIDTH, GLOW_STD_DEV, GLOW_OPACITY,
  FONT, LABEL_SIZE, CALLOUT_SIZE, EQUATION_SIZE, EQUATION_WEIGHT,
} from './kiro-constants.js'
import { COUNTS } from './kiro-graph-data.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const el = (tag, attrs = {}) => {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  return e
}

const NODE_COLORS = { center: CENTER_COLOR, first: FIRST_COLOR, second: SECOND_COLOR, third: THIRD_COLOR, fourth: FOURTH_COLOR }

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
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" result="glow"/>
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
      : link.phase === 'fourth-bloom' ? 'fourth'
      : link.phase === 'third-bloom' ? 'third' : 'second'
    const line = el('line', {
      x1: s.x, y1: s.y, x2: t.x, y2: t.y,
      stroke: EDGE_COLOR, 'stroke-width': EDGE_WIDTH[tier], 'stroke-linecap': 'round',
      opacity: 0, class: `kiro-edge kiro-edge-${link.phase}`, 'data-phase': link.phase, 'data-tier': tier,
    })
    const len = Math.hypot(t.x - s.x, t.y - s.y)
    line.setAttribute('stroke-dasharray', len)
    line.setAttribute('stroke-dashoffset', len)
    edgeGroup.appendChild(line)
    return { el: line, data: link, length: len, tier }
  })

  // nodes
  const nodeEls = nodes.map((node) => {
    const fill = NODE_COLORS[node.type]
    const parentNode = node.parent ? nodeMap[node.parent] : null
    const startX = parentNode ? parentNode.x : node.x
    const startY = parentNode ? parentNode.y : node.y
    const circle = el('circle', {
      cx: startX, cy: startY, r: 0, fill, opacity: 0,
      class: `kiro-node kiro-node-${node.type}`, 'data-id': node.id, 'data-type': node.type,
    })
    if (node.type === 'center') circle.setAttribute('filter', 'url(#kiro-glow)')
    if (node.type === 'first') circle.setAttribute('filter', 'url(#kiro-white-glow)')
    nodeGroup.appendChild(circle)
    return { el: circle, data: node, parentNode }
  })

  // "you" label
  const youNode = nodeMap['you']
  const youLabel = el('text', {
    x: youNode.x, y: youNode.y + RADII.center + 40,
    fill: LABEL_COLOR, 'font-family': FONT, 'font-size': LABEL_SIZE,
    'font-weight': '300', 'text-anchor': 'middle', 'letter-spacing': '3',
    opacity: 0, class: 'kiro-label kiro-label-you',
  })
  youLabel.textContent = 'you'
  labelGroup.appendChild(youLabel)

  // callouts for ALL THREE first-degree nodes — two lines each, persist on screen
  const callouts = {}
  const firstDefs = [
    { id: 'f1', friends: COUNTS.f1Friends },
    { id: 'f2', friends: COUNTS.f2Friends },
    { id: 'f3', friends: COUNTS.f3Friends },
  ]
  for (const fd of firstDefs) {
    const n = nodeMap[fd.id]
    const line1 = el('text', {
      x: n.x, y: n.y - RADII.first - 60,
      fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': CALLOUT_SIZE,
      'font-weight': '400', 'text-anchor': 'middle', opacity: 0,
      class: `kiro-callout kiro-callout-${fd.id}-1`,
    })
    line1.textContent = '+1 friend'
    labelGroup.appendChild(line1)

    const line2 = el('text', {
      x: n.x, y: n.y - RADII.first - 18,
      fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': CALLOUT_SIZE,
      'font-weight': '300', 'text-anchor': 'middle', opacity: 0,
      class: `kiro-callout kiro-callout-${fd.id}-2`,
    })
    line2.textContent = `+${fd.friends} friend group`
    labelGroup.appendChild(line2)
    callouts[fd.id] = { line1, line2 }
  }

  // equation: pre-drop (white, medium)
  const eqPause = el('text', {
    x: WIDTH / 2, y: HEIGHT * 0.84,
    fill: EQUATION_COLOR, 'font-family': FONT, 'font-size': EQUATION_SIZE * 0.75,
    'font-weight': '400', 'text-anchor': 'middle', 'letter-spacing': '1',
    opacity: 0, class: 'kiro-eq kiro-eq-pause',
  })
  eqPause.textContent = `+3 friends = ${COUNTS.preDropTotal - 1} connections`
  labelGroup.appendChild(eqPause)

  // equation: final (red, BIG)
  const eqFinal = el('text', {
    x: WIDTH / 2, y: HEIGHT * 0.84,
    fill: ACCENT_COLOR, 'font-family': FONT, 'font-size': EQUATION_SIZE,
    'font-weight': EQUATION_WEIGHT, 'text-anchor': 'middle', 'letter-spacing': '2',
    opacity: 0, class: 'kiro-eq kiro-eq-final',
  })
  eqFinal.textContent = `+3 friends = ${COUNTS.finalTotal - 1} connections`
  labelGroup.appendChild(eqFinal)

  return { svg, edgeEls, nodeEls, youLabel, callouts, eqPause, eqFinal, nodeMap }
}
