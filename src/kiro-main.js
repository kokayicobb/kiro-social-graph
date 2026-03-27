// kiro-main.js — entry point
import { nodes, links } from './kiro-graph-data.js'
import { computeLayout } from './kiro-layout.js'
import { renderGraph } from './kiro-render.js'
import { createTimeline } from './kiro-timeline.js'
import { DURATION, FPS } from './kiro-constants.js'

const positioned = computeLayout(nodes, links)
const elements = renderGraph(positioned)
const timeline = createTimeline(elements)

// expose for playwright capture
window.__kiroTimeline = timeline
window.__kiroDuration = DURATION
window.__kiroFPS = FPS
window.__kiroReady = true

// auto-play unless in capture mode
if (!new URLSearchParams(window.location.search).has('capture')) {
  timeline.play()
}
