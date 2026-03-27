// kiro-layout.js — v3: handles ~60 nodes, wider bounds
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force'
import { CENTER_POS, FORCE, WIDTH, HEIGHT } from './kiro-constants.js'

export function computeLayout(nodes, links) {
  const simNodes = nodes.map((n) => ({ ...n, x: n.ix, y: n.iy }))
  const simLinks = links.map((l) => ({ ...l }))

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

  for (let i = 0; i < FORCE.ticks; i++) sim.tick()

  const pad = 30
  for (const n of simNodes) {
    n.x = Math.max(pad, Math.min(WIDTH - pad, n.x))
    n.y = Math.max(pad, Math.min(HEIGHT - pad, n.y))
  }

  return { nodes: simNodes, links: simLinks }
}
