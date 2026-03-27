// kiro-layout.js — d3-force position computation
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'
import { CENTER_POS, FORCE, WIDTH, HEIGHT } from './kiro-constants.js'

export function computeLayout(nodes, links) {
  // deep copy so we don't mutate originals
  const simNodes = nodes.map((n) => ({ ...n, x: n.ix, y: n.iy }))
  const simLinks = links.map((l) => ({ ...l }))

  // pin center node
  const center = simNodes.find((n) => n.id === 'you')
  center.fx = CENTER_POS.x
  center.fy = CENTER_POS.y

  const sim = forceSimulation(simNodes)
    .force('link', forceLink(simLinks).id((d) => d.id).distance(FORCE.linkDistance).strength(FORCE.linkStrength))
    .force('charge', forceManyBody().strength(FORCE.chargeStrength))
    .force('collide', forceCollide(FORCE.collisionRadius))
    .force('x', forceX(CENTER_POS.x).strength(FORCE.centerStrength))
    .force('y', forceY(CENTER_POS.y).strength(FORCE.centerStrength))
    .stop()

  // run to completion
  for (let i = 0; i < FORCE.ticks; i++) sim.tick()

  // clamp positions to canvas bounds with padding
  const pad = 40
  for (const n of simNodes) {
    n.x = Math.max(pad, Math.min(WIDTH - pad, n.x))
    n.y = Math.max(pad, Math.min(HEIGHT - pad, n.y))
  }

  return { nodes: simNodes, links: simLinks }
}
