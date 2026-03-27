# kiro-social-graph

cinematic vertical social-network animation for short-form video.

**thesis:** one simple intro to one person can open up an entire social world. three simple intros can expand your reachable network dramatically.

## output

- `output/social-graph-v1.mp4` — first render (147KB)
- `output/social-graph-v2.mp4` — refined render (174KB)
- 1080×1920 vertical, 18 seconds, 30fps, h264

## run commands

```bash
# install
npm install
npx playwright install chromium

# dev server (live preview with auto-play)
npm run dev

# full pipeline: build → capture → encode
npm run render

# or step by step:
npm run build          # vite build → dist/
npm run capture        # playwright frame capture → output/kiro-frames/
npm run encode         # ffmpeg assembly → output/social-graph-v1.mp4

# encode to custom path
bash scripts/kiro-encode.sh output/social-graph-v2.mp4
```

## file structure

```
├── index.html                  # entry point (1080×1920 viewport)
├── package.json
├── vite.config.js
├── src/
│   ├── kiro-constants.js       # all tunable values (colors, timing, radii, forces)
│   ├── kiro-graph-data.js      # node/link definitions, initial positions
│   ├── kiro-layout.js          # d3-force position computation
│   ├── kiro-render.js          # svg rendering layer
│   ├── kiro-timeline.js        # gsap master timeline (18s choreography)
│   └── kiro-main.js            # entry point wiring
├── scripts/
│   ├── kiro-capture.js         # playwright frame-by-frame capture
│   └── kiro-encode.sh          # ffmpeg mp4 assembly
└── output/
    ├── social-graph-v1.mp4
    ├── social-graph-v2.mp4
    └── kiro-frames/            # png frames (generated during capture)
```

## architecture

1. **d3-force** computes stable node positions (runs 400 ticks to completion, then freezes)
2. **svg** renders all nodes/edges at opacity 0
3. **gsap** art-directs the 18-second reveal sequence via a paused master timeline
4. **playwright** steps through the timeline frame-by-frame at 30fps, screenshots each
5. **ffmpeg** assembles frames into h264 mp4

the force simulation is NOT the animation. d3-force computes beautiful positions. gsap choreographs the visible sequence. the graph feels composed, not simulated.

## timeline

| time | phase | what happens |
|------|-------|-------------|
| 0–2s | intro | "you" node fades in with subtle glow pulse |
| 2–4s | first connect | first gold node appears, edge draws to "you" |
| 4–7s | first bloom | 6 second-degree nodes stagger in, "+7 reachable" callout |
| 7–9s | settle | compositional pause, subtle ambient drift |
| 9–11s | second connect | two more gold nodes appear with edges |
| 11–15s | full bloom | 12 remaining nodes stagger in, cross-connections, "22 people reachable" |
| 15–18s | hold | clean end frame, subtle drift only |

## v1 → v2 changelog

| what | v1 | v2 |
|------|----|----|
| node radii (center/first/second) | 22 / 10 / 4.5 | 28 / 14 / 6 |
| edge opacity (first/bloom) | 0.18 / 0.10 | 0.28 / 0.15 |
| first-degree ring radius | 260px | 300px |
| second-degree spread | 140–220px | 150–240px |
| glow intensity | stdDev 6, opacity 0.4 | stdDev 8, opacity 0.5 |
| "+7 reachable" callout | not visible (positioned wrong) | visible, positioned near cluster |
| "22 people reachable" | at 78% height (too far) | dynamically positioned below graph |
| random seed | Math.random (non-deterministic) | seeded PRNG (deterministic) |
| center position | 46% height | 42% height |
| force charge | -120 | -180 |
| collision radius | 30 | 35 |

## stack assessment

**d3-force + gsap + svg + playwright + ffmpeg — was this the right stack?**

yes. each tool does exactly one thing well:

- **d3-force** — perfect for computing organic-looking graph positions without manual placement. the simulation runs to completion offscreen, giving us stable positions that feel natural but aren't random. the alternative (manual coordinates) would be brittle and hard to iterate on.

- **gsap** — the right choice for choreographed reveal animation. its timeline model (labels, stagger, easing, yoyo) maps directly to the narrative structure. the `progress()` API is what makes deterministic frame capture possible — we can seek to any point in the animation instantly.

- **svg** — ideal for this node count (~22 nodes). direct dom manipulation means gsap can animate elements natively. crisp at any resolution. if we had 200+ nodes, canvas would be necessary, but svg is cleaner here.

- **playwright** — headless chromium gives us pixel-perfect screenshots at exact timeline positions. the `page.evaluate()` → `page.screenshot()` loop is simple and deterministic. every run produces identical frames.

- **ffmpeg** — industry standard for frame assembly. h264 with crf 18 gives high quality at tiny file sizes (174KB for 18 seconds of mostly-dark content).

**what would NOT work:**
- remotion — would add react overhead for something that doesn't need components or state management
- canvas — harder to animate individual elements with gsap, no dom targeting
- lottie — designed for after effects export, not programmatic graph animation
- css animations — no timeline scrubbing, can't do deterministic frame capture

## remaining critique

what still feels weak:

1. **the graph occupies the upper 60% of the canvas** — the bottom 40% is mostly empty. this is actually fine for instagram (bottom has UI overlays) but for a standalone piece it could feel unbalanced.

2. **second-degree nodes are small** — they read as dots, not as "people." at 6px radius on a 1080px canvas they're proportionally tiny. bumping to 8px might help but risks making the graph feel cluttered.

3. **the bloom stagger is uniform** — all nodes appear at the same interval (0.18s). varying the stagger (faster at start, slower at end) could feel more organic.

4. **no implied scale beyond 22 nodes** — the prompt mentioned "imply larger network scale through fading clusters." we could add ghost nodes at very low opacity at the edges to suggest the network extends further.

5. **the settle phase (7–9s) is static** — the drift is very subtle. a slight camera push-in during this phase could add cinematic tension before the second wave.

6. **edge drawing is linear** — all edges draw at the same speed. varying speed based on edge length would feel more natural.

none of these are blocking — the piece reads clearly and the thesis is obvious. these are polish items for a v3 if needed.
