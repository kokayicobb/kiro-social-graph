// kiro-timeline.js — gsap master timeline
import gsap from 'gsap'
import {
  TIMING, EDGE_OPACITY, EDGE_FIRST_OPACITY, BLOOM_STAGGER,
  EDGE_DRAW_DURATION, NODE_REVEAL_DURATION, COUNT_FADE_DURATION,
  DRIFT_AMPLITUDE, DRIFT_DURATION, PULSE_SCALE, PULSE_DURATION, DURATION,
} from './kiro-constants.js'

function revealNode(tl, nodeEl, position) {
  const cx = nodeEl.data.x, cy = nodeEl.data.y
  tl.to(nodeEl.el, { opacity: 1, duration: NODE_REVEAL_DURATION, ease: 'power2.out' }, position)
  tl.fromTo(nodeEl.el, {
    attr: { transform: `translate(${cx},${cy}) scale(0) translate(${-cx},${-cy})` },
  }, {
    attr: { transform: `translate(${cx},${cy}) scale(1) translate(${-cx},${-cy})` },
    duration: NODE_REVEAL_DURATION, ease: 'back.out(1.4)',
  }, position)
}

function drawEdge(tl, edgeEl, targetOpacity, position) {
  tl.to(edgeEl.el, { opacity: targetOpacity, duration: 0.3, ease: 'none' }, position)
  tl.to(edgeEl.el, {
    attr: { 'stroke-dashoffset': 0 },
    duration: EDGE_DRAW_DURATION, ease: 'power2.inOut',
  }, position)
}

// finite-repeat drift — calculates repeats to fill remaining time
function addDrift(tl, nodeEl, position) {
  const cx = nodeEl.data.x, cy = nodeEl.data.y
  const dx = (Math.random() - 0.5) * DRIFT_AMPLITUDE * 2
  const dy = (Math.random() - 0.5) * DRIFT_AMPLITUDE * 2
  const remaining = DURATION - position
  const repeats = Math.max(1, Math.floor(remaining / DRIFT_DURATION) - 1)
  tl.to(nodeEl.el, {
    attr: { cx: cx + dx, cy: cy + dy },
    duration: DRIFT_DURATION, ease: 'sine.inOut', yoyo: true, repeat: repeats,
  }, position)
}

export function createTimeline(elements) {
  const { edgeEls, nodeEls, youLabel, countFirst, countFull } = elements
  const tl = gsap.timeline({ paused: true })

  const nodeById = (id) => nodeEls.find((n) => n.data.id === id)
  const edgesByPhase = (phase) => edgeEls.filter((e) => e.data.phase === phase)
  const nodesByGroup = (group) => nodeEls.filter((n) => n.data.group === group && n.data.type === 'second')

  // ── 0.0–2.0s: INTRO ──
  const youNode = nodeById('you')
  revealNode(tl, youNode, TIMING.introStart + 0.3)
  tl.to(youLabel, { opacity: 0.7, duration: 0.8, ease: 'power2.out' }, TIMING.introStart + 0.8)

  // breathing pulse — finite repeats
  const cx = youNode.data.x, cy = youNode.data.y
  const pulseRepeats = Math.floor((DURATION - 1.2) / PULSE_DURATION) - 1
  tl.to(youNode.el, {
    attr: { transform: `translate(${cx},${cy}) scale(${PULSE_SCALE}) translate(${-cx},${-cy})` },
    duration: PULSE_DURATION, ease: 'sine.inOut', yoyo: true, repeat: pulseRepeats,
  }, TIMING.introStart + 1.2)

  // ── 2.0–3.8s: FIRST CONNECTION ──
  const f1Node = nodeById('f1')
  const f1Edge = edgesByPhase('first-connect')[0]
  drawEdge(tl, f1Edge, EDGE_FIRST_OPACITY, TIMING.firstConnectStart)
  revealNode(tl, f1Node, TIMING.firstConnectStart + 0.3)

  // ── 4.0–6.8s: FIRST BLOOM ──
  const group1Nodes = nodesByGroup(1)
  const group1Edges = edgesByPhase('first-bloom')
  group1Nodes.forEach((n, i) => revealNode(tl, n, TIMING.firstBloomStart + i * BLOOM_STAGGER))
  group1Edges.forEach((e, i) => drawEdge(tl, e, EDGE_OPACITY, TIMING.firstBloomStart + i * BLOOM_STAGGER))

  // count callout
  tl.to(countFirst, { opacity: 0.6, duration: COUNT_FADE_DURATION, ease: 'power2.out' }, TIMING.firstBloomEnd - 0.5)

  // ── 7.0–9.0s: SETTLE ──
  ;[youNode, f1Node, ...group1Nodes].forEach((n) => addDrift(tl, n, TIMING.settleStart))
  tl.to(countFirst, { opacity: 0, duration: 0.5, ease: 'power2.in' }, TIMING.settleEnd - 0.6)

  // ── 9.0–10.8s: SECOND + THIRD CONNECTIONS ──
  const f2Node = nodeById('f2')
  const f3Node = nodeById('f3')
  const connectEdges = edgesByPhase('second-connect')
  drawEdge(tl, connectEdges[0], EDGE_FIRST_OPACITY, TIMING.secondConnectStart)
  revealNode(tl, f2Node, TIMING.secondConnectStart + 0.2)
  drawEdge(tl, connectEdges[1], EDGE_FIRST_OPACITY, TIMING.secondConnectStart + 0.6)
  revealNode(tl, f3Node, TIMING.secondConnectStart + 0.8)

  // ── 11.0–14.8s: FULL BLOOM ──
  const group2Nodes = nodesByGroup(2)
  const group3Nodes = nodesByGroup(3)
  const bloomEdges = edgesByPhase('full-bloom')

  // interleave groups for visual balance
  const allBloomNodes = []
  const maxLen = Math.max(group2Nodes.length, group3Nodes.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < group2Nodes.length) allBloomNodes.push(group2Nodes[i])
    if (i < group3Nodes.length) allBloomNodes.push(group3Nodes[i])
  }
  allBloomNodes.forEach((n, i) => revealNode(tl, n, TIMING.fullBloomStart + i * BLOOM_STAGGER))
  bloomEdges.forEach((e, i) => drawEdge(tl, e, EDGE_OPACITY, TIMING.fullBloomStart + i * (BLOOM_STAGGER * 0.8)))

  ;[f2Node, f3Node, ...group2Nodes, ...group3Nodes].forEach((n) => addDrift(tl, n, TIMING.fullBloomEnd - 0.5))

  // full count
  tl.to(countFull, { opacity: 0.7, duration: COUNT_FADE_DURATION, ease: 'power2.out' }, TIMING.fullBloomEnd - 0.3)

  // ── 15.0–18.0s: HOLD ──
  tl.to(youLabel, { opacity: 0.5, duration: 1.5, ease: 'power2.inOut' }, TIMING.holdStart)

  // anchor end of timeline
  tl.set({}, {}, DURATION)

  return tl
}
