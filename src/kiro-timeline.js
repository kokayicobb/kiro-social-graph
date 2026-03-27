// kiro-timeline.js — v3: emerge, shimmer, third ring, equations, pause-before-drop
import gsap from 'gsap'
import {
  TIMING, EDGE_OPACITY, BLOOM_STAGGER, THIRD_STAGGER,
  EMERGE_DURATION, EDGE_DRAW_DURATION, NODE_REVEAL_DURATION,
  SHIMMER_DURATION, SHIMMER_AMOUNT, DRIFT_AMPLITUDE, DRIFT_DURATION,
  PULSE_SCALE, PULSE_DURATION, DURATION, RADII,
} from './kiro-constants.js'

// reveal center/first node (no emerge — they appear in place)
function revealNode(tl, nodeEl, position) {
  const { x, y } = nodeEl.data
  tl.to(nodeEl.el, { opacity: 1, duration: NODE_REVEAL_DURATION, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { cx: x, cy: y, r: RADII[nodeEl.data.type] }, duration: NODE_REVEAL_DURATION, ease: 'back.out(1.4)' }, position)
}

// emerge: node flies out from parent to final position
function emergeNode(tl, nodeEl, position) {
  const { x, y, type } = nodeEl.data
  tl.to(nodeEl.el, { opacity: 1, duration: EMERGE_DURATION * 0.6, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { cx: x, cy: y }, duration: EMERGE_DURATION, ease: 'power2.out' }, position)
  tl.to(nodeEl.el, { attr: { r: RADII[type] }, duration: EMERGE_DURATION * 0.5, ease: 'back.out(1.2)' }, position)
}

function drawEdge(tl, edgeEl, position) {
  const opacity = EDGE_OPACITY[edgeEl.tier]
  tl.to(edgeEl.el, { opacity, duration: 0.3, ease: 'none' }, position)
  tl.to(edgeEl.el, { attr: { 'stroke-dashoffset': 0 }, duration: EDGE_DRAW_DURATION, ease: 'power2.inOut' }, position)
}

// shimmer: subtle opacity pulse on drawn edges
function addShimmer(tl, edgeEl, position) {
  const base = EDGE_OPACITY[edgeEl.tier]
  const remaining = DURATION - position
  const repeats = Math.max(1, Math.floor(remaining / SHIMMER_DURATION) - 1)
  tl.to(edgeEl.el, {
    opacity: base * SHIMMER_AMOUNT, duration: SHIMMER_DURATION,
    ease: 'sine.inOut', yoyo: true, repeat: repeats,
  }, position)
}

function addDrift(tl, nodeEl, position) {
  const { x, y } = nodeEl.data
  const dx = (Math.sin(nodeEl.data.ix * 7) * 0.5) * DRIFT_AMPLITUDE * 2
  const dy = (Math.cos(nodeEl.data.iy * 11) * 0.5) * DRIFT_AMPLITUDE * 2
  const remaining = DURATION - position
  const repeats = Math.max(1, Math.floor(remaining / DRIFT_DURATION) - 1)
  tl.to(nodeEl.el, {
    attr: { cx: x + dx, cy: y + dy },
    duration: DRIFT_DURATION, ease: 'sine.inOut', yoyo: true, repeat: repeats,
  }, position)
}

export function createTimeline(elements) {
  const { edgeEls, nodeEls, youLabel, eq1Line1, eq1Line2, eqPause, eqFinal, nodeMap } = elements
  const tl = gsap.timeline({ paused: true })

  const nodeById = (id) => nodeEls.find((n) => n.data.id === id)
  const edgesByPhase = (phase) => edgeEls.filter((e) => e.data.phase === phase)
  const nodesByType = (type, group) => nodeEls.filter((n) => n.data.type === type && (group == null || n.data.group === group))
  const nodesByParent = (parentId) => nodeEls.filter((n) => n.data.parent === parentId)

  // ── 0–2s: INTRO — red "you" node ──
  const youNode = nodeById('you')
  revealNode(tl, youNode, TIMING.introStart + 0.3)
  tl.to(youLabel, { opacity: 0.7, duration: 0.8, ease: 'power2.out' }, TIMING.introStart + 0.8)

  // breathing pulse
  const cx = youNode.data.x, cy = youNode.data.y
  const pulseRepeats = Math.floor((DURATION - 1.2) / PULSE_DURATION) - 1
  tl.fromTo(youNode.el,
    { attr: { r: RADII.center } },
    { attr: { r: RADII.center * PULSE_SCALE }, duration: PULSE_DURATION, ease: 'sine.inOut', yoyo: true, repeat: pulseRepeats },
    TIMING.introStart + 1.2)

  // ── 2–3.8s: FIRST CONNECTION — white node ──
  const f1Node = nodeById('f1')
  const f1Edge = edgesByPhase('first-connect')[0]
  drawEdge(tl, f1Edge, TIMING.firstConnectStart)
  revealNode(tl, f1Node, TIMING.firstConnectStart + 0.3)
  addShimmer(tl, f1Edge, TIMING.firstConnectStart + EDGE_DRAW_DURATION + 0.5)

  // ── 4–6.8s: FIRST BLOOM — off-white nodes EMERGE from f1 ──
  const group1Nodes = nodesByType('second', 1)
  const group1Edges = edgesByPhase('first-bloom')
  group1Nodes.forEach((n, i) => {
    const t = TIMING.firstBloomStart + i * BLOOM_STAGGER
    emergeNode(tl, n, t)
  })
  group1Edges.forEach((e, i) => {
    const t = TIMING.firstBloomStart + i * BLOOM_STAGGER
    drawEdge(tl, e, t)
    addShimmer(tl, e, t + EDGE_DRAW_DURATION + 1)
  })

  // "+1 friend / +6 friend group" callout
  tl.to(eq1Line1, { opacity: 0.7, duration: 0.6, ease: 'power2.out' }, TIMING.firstCalloutStart)
  tl.to(eq1Line2, { opacity: 0.5, duration: 0.6, ease: 'power2.out' }, TIMING.firstCalloutStart + 0.2)

  // ── 7–9s: SETTLE ──
  ;[youNode, f1Node, ...group1Nodes].forEach((n) => addDrift(tl, n, TIMING.settleStart))
  // fade out first callout
  tl.to(eq1Line1, { opacity: 0, duration: 0.5, ease: 'power2.in' }, TIMING.settleEnd - 0.6)
  tl.to(eq1Line2, { opacity: 0, duration: 0.5, ease: 'power2.in' }, TIMING.settleEnd - 0.6)

  // ── 9–10.8s: SECOND + THIRD CONNECTIONS ──
  const f2Node = nodeById('f2')
  const f3Node = nodeById('f3')
  const connectEdges = edgesByPhase('second-connect')
  drawEdge(tl, connectEdges[0], TIMING.secondConnectStart)
  revealNode(tl, f2Node, TIMING.secondConnectStart + 0.2)
  drawEdge(tl, connectEdges[1], TIMING.secondConnectStart + 0.6)
  revealNode(tl, f3Node, TIMING.secondConnectStart + 0.8)
  connectEdges.forEach((e) => addShimmer(tl, e, TIMING.secondConnectEnd + 0.5))

  // ── 11–14.8s: FULL BLOOM — second-degree emerge from f2/f3 ──
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

  ;[f2Node, f3Node, ...group2Nodes, ...group3Nodes].forEach((n) => addDrift(tl, n, TIMING.fullBloomEnd - 0.3))

  // ── 15–17s: PAUSE — show pre-drop equation ──
  tl.to(youLabel, { opacity: 0.4, duration: 0.8, ease: 'power2.inOut' }, TIMING.pauseStart)
  tl.to(eqPause, { opacity: 0.8, duration: 0.8, ease: 'power2.out' }, TIMING.pauseStart + 0.3)
  // fade out pre-drop equation before the drop
  tl.to(eqPause, { opacity: 0, duration: 0.4, ease: 'power2.in' }, TIMING.pauseEnd - 0.5)

  // ── 17–21s: THIRD RING ERUPTS — fast stagger, chain reactions ──
  const thirdEdges = edgesByPhase('third-bloom')
  const thirdNodes = nodesByType('third')

  // group by parent for chain-reaction feel
  const parentGroups = {}
  thirdNodes.forEach((n) => {
    const pid = n.data.parent
    if (!parentGroups[pid]) parentGroups[pid] = []
    parentGroups[pid].push(n)
  })

  let groupIdx = 0
  for (const [parentId, children] of Object.entries(parentGroups)) {
    const groupStart = TIMING.thirdBloomStart + groupIdx * 0.15
    children.forEach((n, i) => {
      emergeNode(tl, n, groupStart + i * THIRD_STAGGER)
    })
    // edges for this parent's children
    const childEdges = thirdEdges.filter((e) => {
      const src = typeof e.data.source === 'object' ? e.data.source.id : e.data.source
      return src === parentId
    })
    childEdges.forEach((e, i) => {
      drawEdge(tl, e, groupStart + i * THIRD_STAGGER)
    })
    groupIdx++
  }

  // shimmer on all third edges
  thirdEdges.forEach((e) => addShimmer(tl, e, TIMING.thirdBloomEnd))

  // drift on third nodes
  thirdNodes.forEach((n) => addDrift(tl, n, TIMING.thirdBloomEnd))

  // ── 21–24s: HOLD — final equation in accent red ──
  tl.to(eqFinal, { opacity: 0.9, duration: 1.0, ease: 'power2.out' }, TIMING.holdStart + 0.3)

  // anchor end
  tl.set({}, {}, DURATION)

  return tl
}
