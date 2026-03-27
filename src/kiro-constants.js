// kiro-constants.js — all tunable values for the social graph animation

// canvas
export const WIDTH = 1080
export const HEIGHT = 1920

// colors
export const BG_COLOR = '#0a0a0a'
export const NODE_COLOR = '#d4d4d4'
export const EDGE_COLOR = '#ffffff'
export const ACCENT_COLOR = '#d4a054'
export const LABEL_COLOR = '#ffffff'
export const COUNT_COLOR = '#d4a054'

// node radii by type — v2: bigger for readability
export const RADII = { center: 28, first: 14, second: 6 }

// edge style — v2: more visible
export const EDGE_WIDTH = 1.0
export const EDGE_OPACITY = 0.15
export const EDGE_FIRST_OPACITY = 0.28

// glow filter
export const GLOW_STD_DEV = 8
export const GLOW_OPACITY = 0.5

// typography — v2: larger
export const FONT = 'Inter, system-ui, sans-serif'
export const LABEL_SIZE = 15
export const COUNT_SIZE = 16

// timing (seconds)
export const DURATION = 18
export const FPS = 30
export const TIMING = {
  introStart: 0, introEnd: 2,
  firstConnectStart: 2, firstConnectEnd: 3.8,
  firstBloomStart: 4, firstBloomEnd: 6.8,
  settleStart: 7, settleEnd: 9,
  secondConnectStart: 9, secondConnectEnd: 10.8,
  fullBloomStart: 11, fullBloomEnd: 14.8,
  holdStart: 15, holdEnd: 18,
}

// animation
export const BLOOM_STAGGER = 0.18
export const EDGE_DRAW_DURATION = 0.7
export const NODE_REVEAL_DURATION = 0.6
export const COUNT_FADE_DURATION = 0.8
export const DRIFT_AMPLITUDE = 3
export const DRIFT_DURATION = 4
export const PULSE_SCALE = 1.06
export const PULSE_DURATION = 2.5

// d3-force — v2: wider spread
export const FORCE = {
  centerStrength: 0.015,
  chargeStrength: -180,
  collisionRadius: 35,
  linkDistance: 200,
  linkStrength: 0.25,
  ticks: 400,
}

// layout — v2: spread out more, better use of vertical space
export const CENTER_POS = { x: WIDTH / 2, y: HEIGHT * 0.42 }
export const FIRST_RING_RADIUS = 300
export const SECOND_RING_MIN = 150
export const SECOND_RING_MAX = 240
