// kiro-timeline.js — v4: persistent callouts, fourth ring, bigger everything
import gsap from 'gsap'
import {
  TIMING, EDGE_OPACITY, BLOOM_STAGGER, THIRD_STAGGER, FOURTH_STAGGER,
  EMERGE_DURATION, EDGE_DRAW_DURATION, NODE_REVEAL_DURATION,
  SHIMMER_DURATION, SHIMMER_AMOUNT, DRIFT_AMPLITUDE, DRIFT_DURATION,
  PULSE_SCALE, PULSE_DURATION, DURATION, RADII,
} from './kiro-constants.js'

function revealNode(tl, nodeEl, position) {
  const { x, y, type } = nodeEl.data
  tl.to(nodeEl.el, { opacity: 1, duration: NODE_REVEAL_DURATION, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { cx: x, cy: y, r: RADII[type] }, duration: NODE_REVEAL_DURATION, ease: 'back.out(1.4)' }, position)
}

function emergeNode(tl, nodeEl, position) {
  const { x, y, type } = nodeEl.data
  tl.to(nodeEl.el, { opacity: 1, duration: EMERGE_DURATION * 0.6, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { cx: x, cy: y }, duration: EMERGE_DURATION, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { r: RADII[type] }, duration: EMERGE_DURATION * 0.5, ease: 'back.out(1.2)' }, position)
}

function drawEdge(tl, edgeEl, position) {
  tl.to(edgeEl.el, { opacity: EDGE_OPACITY[edgeEl.tier], duration: 0.3, ease: 'none' }, position)
  tl.to(edgeEl.el, { attr: { 'stroke-dashoffset': 0 }, duration: EDGE_DRAW_DURATION, ease: 'power2.inOut' }, position)
}

function addShimmer(tl, edgeEl, position) {
  const base = EDGE_OPACITY[edgeEl.tier]
  const repeats = Math.max(1, Math.floor((DURATION - position) / SHIMMER_DURATION) - 1)
  tl.to(edgeEl.el, { opacity: base * SHIMMER_AMOUNT, duration: SHIMMER_DURATION, ease: 'sine.inOut', yoyo: true, repeat: repeats }, position)
}

function addDrift(tl, nodeEl, position) {
  const { x, y } = nodeEl.data
  const dx = Math.sin(nodeEl.data.ix * 7) * DRIFT_AMPLITUDE
  const dy = Math.cos(nodeEl.data.iy * 11) * DRIFT_AMPLITUDE
  const repeats = Math.max(1, Math.floor((DURATION - position) / DRIFT_DURATION) - 1)
  tl.to(nodeEl.el, { attr: { cx: x + dx, cy: y + dy }, duration: DRIFT_DURATION, ease: 'sine.inOut', yoyo: true, repeat: repeats }, position)
}

export function createTimeline(elements) {
  const { edgeEls, nodeEls, youLabel, callouts, eqPause, eqFinal, nodeMap } = elements
  const tl = gsap.timeline({ paused: true })

  const nodeById = (id) => nodeEls.find((n) => n.data.id === id)
  const edgesByPhase = (phase) => edgeEls.filter((e) => e.data.phase === phase)
  const nodesByType = (type, group) => nodeEls.filter((n) => n.data.type === type && (group == null || n.data.group === group))

  // ── INTRO (0–2s) ──
  const youNode = nodeById('you')
  revealNode(tl, youNode, TIMING.introStart + 0.3)
  tl.to(youLabel, { opacity: 0.7, duration: 0.8, ease: 'power2.out' }, TIMING.introStart + 0.8)
  const pulseRepeats = Math.floor((DURATION - 1.2) / PULSE_DURATION) - 1
  tl.fromTo(youNode.el, { attr: { r: RADII.center } }, { attr: { r: RADII.center * PULSE_SCALE }, duration: PULSE_DURATION, ease: 'sine.inOut', yoyo: true, repeat: pulseRepeats }, 1.2)

  // ── FIRST CONNECTION (2–3.8s) ──
  const f1Node = nodeById('f1')
  const f1Edge = edgesByPhase('first-connect')[0]
  drawEdge(tl, f1Edge, TIMING.firstConnectStart)
  revealNode(tl, f1Node, TIMING.firstConnectStart + 0.3)
  addShimmer(tl, f1Edge, TIMING.firstConnectEnd + 0.5)

  // ── FIRST BLOOM (4–6.8s) ──
  const group1Nodes = nodesByType('second', 1)
  const group1Edges = edgesByPhase('first-bloom')
  group1Nodes.forEach((n, i) => emergeNode(tl, n, TIMING.firstBloomStart + i * BLOOM_STAGGER))
  group1Edges.forEach((e, i) => {
    drawEdge(tl, e, TIMING.firstBloomStart + i * BLOOM_STAGGER)
    addShimmer(tl, e, TIMING.firstBloomEnd + 0.5)
  })

  // f1 callout — persists (no fade out)
  tl.to(callouts.f1.line1, { opacity: 0.8, duration: 0.5, ease: 'power2.out' }, TIMING.firstCalloutStart)
  tl.to(callouts.f1.line2, { opacity: 0.6, duration: 0.5, ease: 'power2.out' }, TIMING.firstCalloutStart + 0.15)

  // ── SETTLE (7–9s) ──
  ;[youNode, f1Node, ...group1Nodes].forEach((n) => addDrift(tl, n, TIMING.settleStart))

  // ── SECOND + THIRD CONNECTIONS (9–10.8s) ──
  const f2Node = nodeById('f2')
  const f3Node = nodeById('f3')
  const connectEdges = edgesByPhase('second-connect')
  drawEdge(tl, connectEdges[0], TIMING.secondConnectStart)
  revealNode(tl, f2Node, TIMING.secondConnectStart + 0.2)
  drawEdge(tl, connectEdges[1], TIMING.secondConnectStart + 0.6)
  revealNode(tl, f3Node, TIMING.secondConnectStart + 0.8)
  connectEdges.forEach((e) => addShimmer(tl, e, TIMING.secondConnectEnd + 0.5))

  // ── FULL BLOOM (11–14.8s) ──
  const group2Nodes = nodesByType('second', 2)
  const group3Nodes = nodesByType('second', 3)
  const bloomEdges = edgesByPhase('full-bloom')

  const allBloomNodes = []
  const maxLen = Math.max(group2Nodes.length, group3Nodes.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < group2Nodes.length) allBloomNodes.push(group2Nodes[i])
    if (i < group3Nodes.length) allBloomNodes.push(group3Nodes[i])
  }
  allBloomNodes.forEach((n, i) => emergeNode(tl, n, TIMING.fullBloomStart + i * BLOOM_STAGGER))
  bloomEdges.forEach((e, i) => {
    drawEdge(tl, e, TIMING.fullBloomStart + i * (BLOOM_STAGGER * 0.7))
    addShimmer(tl, e, TIMING.fullBloomEnd + 0.5)
  })

  // f2 + f3 callouts — appear after their blooms, persist
  tl.to(callouts.f2.line1, { opacity: 0.8, duration: 0.5, ease: 'power2.out' }, TIMING.fullBloomStart + 1.5)
  tl.to(callouts.f2.line2, { opacity: 0.6, duration: 0.5, ease: 'power2.out' }, TIMING.fullBloomStart + 1.65)
  tl.to(callouts.f3.line1, { opacity: 0.8, duration: 0.5, ease: 'power2.out' }, TIMING.fullBloomStart + 2.5)
  tl.to(callouts.f3.line2, { opacity: 0.6, duration: 0.5, ease: 'power2.out' }, TIMING.fullBloomStart + 2.65)

  ;[f2Node, f3Node, ...group2Nodes, ...group3Nodes].forEach((n) => addDrift(tl, n, TIMING.fullBloomEnd - 0.3))

  // ── PAUSE (15–17s) — pre-drop equation ──
  tl.to(youLabel, { opacity: 0.3, duration: 0.8, ease: 'power2.inOut' }, TIMING.pauseStart)
  tl.to(eqPause, { opacity: 0.8, duration: 0.8, ease: 'power2.out' }, TIMING.pauseStart + 0.3)
  tl.to(eqPause, { opacity: 0, duration: 0.4, ease: 'power2.in' }, TIMING.pauseEnd - 0.5)

  // ── THIRD RING (17–20.5s) ──
  const thirdEdges = edgesByPhase('third-bloom')
  const thirdNodes = nodesByType('third')
  const parentGroups = {}
  thirdNodes.forEach((n) => {
    const pid = n.data.parent
    if (!parentGroups[pid]) parentGroups[pid] = []
    parentGroups[pid].push(n)
  })
  let groupIdx = 0
  for (const [parentId, children] of Object.entries(parentGroups)) {
    const groupStart = TIMING.thirdBloomStart + groupIdx * 0.15
    children.forEach((n, i) => emergeNode(tl, n, groupStart + i * THIRD_STAGGER))
    thirdEdges.filter((e) => (typeof e.data.source === 'object' ? e.data.source.id : e.data.source) === parentId)
      .forEach((e, i) => drawEdge(tl, e, groupStart + i * THIRD_STAGGER))
    groupIdx++
  }
  thirdEdges.forEach((e) => addShimmer(tl, e, TIMING.thirdBloomEnd))
  thirdNodes.forEach((n) => addDrift(tl, n, TIMING.thirdBloomEnd))

  // ── FOURTH RING (20.5–23.5s) — expansion never stops ──
  const fourthEdges = edgesByPhase('fourth-bloom')
  const fourthNodeEls = nodesByType('fourth')
  const fourthGroups = {}
  fourthNodeEls.forEach((n) => {
    const pid = n.data.parent
    if (!fourthGroups[pid]) fourthGroups[pid] = []
    fourthGroups[pid].push(n)
  })
  let fgIdx = 0
  for (const [parentId, children] of Object.entries(fourthGroups)) {
    const groupStart = TIMING.fourthBloomStart + fgIdx * 0.12
    children.forEach((n, i) => emergeNode(tl, n, groupStart + i * FOURTH_STAGGER))
    fourthEdges.filter((e) => (typeof e.data.source === 'object' ? e.data.source.id : e.data.source) === parentId)
      .forEach((e, i) => drawEdge(tl, e, groupStart + i * FOURTH_STAGGER))
    fgIdx++
  }

  // ── FINAL EQUATION (22–24s) ──
  tl.to(eqFinal, { opacity: 0.95, duration: 1.0, ease: 'power2.out' }, TIMING.holdStart + 1)

  tl.set({}, {}, DURATION)
  return tl
}
