// kiro-constants.js — v3: red center, white hierarchy, 24s, third ring

export const WIDTH = 1080
export const HEIGHT = 1920

// colors — v3: red center, white/off-white hierarchy
export const BG_COLOR = '#0a0a0a'
export const CENTER_COLOR = '#e63946'
export const FIRST_COLOR = '#ffffff'
export const SECOND_COLOR = '#c0c0c0'
export const THIRD_COLOR = '#707070'
export const EDGE_COLOR = '#ffffff'
export const LABEL_COLOR = '#ffffff'
export const EQUATION_COLOR = '#e8e8e8'
export const ACCENT_COLOR = '#e63946'

// node radii
export const RADII = { center: 30, first: 14, second: 6, third: 3.5 }

// edge style
export const EDGE_WIDTH = { first: 1.0, second: 0.8, third: 0.5 }
export const EDGE_OPACITY = { first: 0.25, second: 0.14, third: 0.07 }

// glow
export const GLOW_STD_DEV = 8
export const GLOW_OPACITY = 0.5

// typography
export const FONT = 'Inter, system-ui, sans-serif'
export const LABEL_SIZE = 15
export const EQUATION_SIZE = 17
export const EQUATION_SMALL = 14

// timing (24 seconds)
export const DURATION = 24
export const FPS = 30
export const TIMING = {
  introStart: 0, introEnd: 2,
  firstConnectStart: 2, firstConnectEnd: 3.8,
  firstBloomStart: 4, firstBloomEnd: 6.8,
  firstCalloutStart: 6.5,
  settleStart: 7, settleEnd: 9,
  secondConnectStart: 9, secondConnectEnd: 10.8,
  fullBloomStart: 11, fullBloomEnd: 14.8,
  pauseStart: 15, pauseEnd: 17,
  thirdBloomStart: 17, thirdBloomEnd: 21,
  holdStart: 21, holdEnd: 24,
}

// animation
export const BLOOM_STAGGER = 0.18
export const THIRD_STAGGER = 0.06
export const EMERGE_DURATION = 0.8
export const EDGE_DRAW_DURATION = 0.6
export const NODE_REVEAL_DURATION = 0.5
export const SHIMMER_DURATION = 3
export const SHIMMER_AMOUNT = 1.6
export const DRIFT_AMPLITUDE = 2.5
export const DRIFT_DURATION = 4
export const PULSE_SCALE = 1.06
export const PULSE_DURATION = 2.5

// d3-force — wider for more nodes
export const FORCE = {
  centerStrength: 0.012,
  chargeStrength: -140,
  collisionRadius: 22,
  linkDistance: 160,
  linkStrength: 0.2,
  ticks: 500,
}

// layout
export const CENTER_POS = { x: WIDTH / 2, y: HEIGHT * 0.38 }
export const FIRST_RING_RADIUS = 260
export const SECOND_RING_MIN = 130
export const SECOND_RING_MAX = 210
export const THIRD_RING_MIN = 90
export const THIRD_RING_MAX = 160
