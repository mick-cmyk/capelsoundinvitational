# Capel Sound Invitational 2026: handover

You are picking up a browser sailing game built in one long session between Mick Russell (owner, Mornington Peninsula, Victoria) and Claude. This file tells you what exists, how it works, why it is the way it is, and where the sharp edges are. Read it before touching `index.html`.

## 1. What it is

A 3D sailing race on the southern shore of Port Phillip, between Rye Pier and Rosebud Pier, past Capel Sound. Mick sails this water. The race format is his:

- **Two fleets, one gun.** Half the boats start off Rye heading east, half off Rosebud heading west. The player picks an end.
- **Start lines.** Each line runs from a yellow buoy (offshore end, the "pin") to a start boat at the **beach** end. The pin is also the rounding mark for the *other* fleet.
- **Course.** Start, through the shared gate off Capel Sound, round the far fleet's start mark **to port** (keep it on your left), back through the gate, finish on your own line. Fleets meet head-on at the gate both ways.
- **Laps.** Mixed fleet (Sabre dinghy, Tornado catamaran, windsurfer). Faster classes sail 2 laps, others 1. Between laps a 2-lap boat **rounds its own start mark to port** and heads back out. It does not cross the line in and out (Mick corrected this explicitly).
- **Rules from the gun.** Port gives way to starboard, windward boat keeps clear, a boat clear astern keeps clear. A foul costs 720° of penalty turns, touching a mark 360°. AI boats obey and do their turns.
- **19 AI rivals** plus the player: 20 boats.
- **Wind.** Five presets, plus **Live now** and **Event forecast** from Open-Meteo. Wind shifts in direction and strength during the race and every change is announced.
- **Waves.** Swell runs downwind; boats and marks pitch and roll on it.
- **Leaderboard.** Skipper name and boat name go to a shared online leaderboard (Supabase).

Live: https://capelsoundinvitational.vercel.app
Repo: https://github.com/mick-cmyk/capelsoundinvitational (push to `main` deploys)
A private copy also lives as a claude.ai artifact (`/home/claude/pier-to-pier/index.html` in the original session). The artifact copy cannot reach the network, so weather and leaderboard show as offline there. The Vercel site is the real one.

## 2. Repo layout

```
index.html               the whole game: HTML, CSS, JS, ~125 KB, no build step
README.md                short public readme
HANDOVER.md              this file
supabase/leaderboard.sql table + RLS for the leaderboard (already applied, see 6)
tests/race-sim.mjs       headless smoke test (Playwright), see 9
```

Dependencies are CDN only: Three.js **r128** (`three.min.js` + `examples/js/controls/OrbitControls.js` from jsDelivr, pinned `three@0.128.0`), Google Fonts (Instrument Serif, Figtree, JetBrains Mono). No framework, no bundler. Keep it that way unless Mick asks; he edits and redeploys by pushing one file.

**Two copies of the page.** The original session edited `pier-to-pier/index.html` (artifact format: no `<html>/<head>/<body>`, starts with `<title>`), then built the repo's `index.html` by prepending a doctype/head block (charset, viewport, favicon, base reset) and splitting at the first `</style>` into head and body. If you only work in the repo, just edit `index.html` directly and ignore the artifact.

## 3. Code map (search by name; line numbers drift)

All JS is one async IIFE at the bottom of `index.html`. Sections are marked `/* ---------- name ---------- */`.

| Section | Key names | What it does |
|---|---|---|
| helpers | `wrap180`, `wrap360`, `clamp`, `smooth`, `vnoise`, `fbm`, `lsGet/lsSet` | maths, noise, safe localStorage |
| the bay | `SHORE`, `shore(x,z)`, `shorePoint(s)`, `BANKS`, `bankF`, `depthAt`, `heightAt` | world geometry. Coastline polyline traced from a satellite screenshot: pixel → world via `P(px,py)=[(px-1000)/10,(py-400)/10]`. `shore()` returns signed distance (positive = water) in globals `SH_D`, `SH_S`. `depthAt` is the single source of truth for depth (metres) used by rendering, physics and AI |
| course | `CD`, `PERP`, `LINES`, `MK`, `MARKS`, `FLEETS`, `FL(r)`, `PIERS` | `CD` = unit vector Rye→Rosebud, `PERP` points shoreward. `LINES.rye/rose` have `c` (centre), `pin` (offshore), `cb` (start boat, beach end), `half`. `FLEETS['1']` = Rye fleet (`d:1`, far mark `MK.roseP`), `FLEETS['-1']` = Rosebud fleet. A racer's fleet is `r.fd` (1 or -1) |
| renderer | `renderer`, `camera`, `controls`, `sun` | WebGL, sRGB, PCF soft shadows; sun and shadow frustum follow the camera target |
| terrain | `tc` canvas, `terrain`, `water`, `WV`, `WU`, `waveAt`, `WAVE_GLSL` | seabed/land texture painted per pixel from `depthAt`; heightfield mesh; translucent water plane with vertex-shader waves (`onBeforeCompile`). **`waveAt()` in JS mirrors `WAVE_GLSL` exactly.** Change one, change both |
| shore dressing | instanced houses, trees, pines; piers; breakwater | all procedural, seeded |
| marks | `buoy`, `startBoat`, `dashed`, `LBL`, `nextRing`, laylines | |
| boats | `BOATS`, `polar`, `vmgAngles`, `sailGeo`, `sailTex`, `hullGeo`, `buildBoat(id,opt)` | per-class polars and 3D models. Tornado jib sits on a `stay` group tilted along the forestay so its head stays on the mast |
| wind | `WPRESET`, `W`, `resetWind`, `updateWind`, `GUSTS`, `windAt`, `WX`, `fetchWx`, `setEvent`, `lbWind` | base wind + oscillation + announced shifts + drifting gust/lull patches. `windAt(x,z)` gives local wind |
| state | `LEGDEF`, `makeLegs(laps,d)`, `courseSpeed`, `lapsAt`, `S`, `b` | `S` = race state, `b` = player boat |
| race logic | `startRace`, `gun`, `legDone`, `finish`, `penalty`, `step`, `sail` | `sail(r,B,st,dt,skill,tgtH)` is the **shared physics** for player and AI |
| fleet | `FLEET_DEF`, `AIS`, `makeFleet`, `placeFleet`, `crossGoal`, `aiGoal`, `clearAhead`, `aiPlan`, `aiStep`, `keepClear`, `avoid`, `bumps` | AI and the rules |
| course progress | `advance(r,…)`, `checkCourse`, `legTarget`, `prog`, `place` | `advance` is shared by player and AI |
| camera | `snapCam`, `CAMD`, `setOverview`, `updateCamera` | chase / wind-up / north-up; course overview |
| visuals | `updateVisuals`, `poseBoat` | per-frame: streaks, gusts, boats on waves, sails, crew, laylines |
| HUD | `hud`, `drawMini`, `placeMap`, `drawTrend` | instruments, hints, countdown, mini chart |
| input | `keys`, `holdBtn`, `askRestart` | keyboard + touch |
| menus | `showMenu`, `showResults`, `renderFleet`, leaderboard fns | |
| loop | `frame` | `requestAnimationFrame`, dt capped at 0.05 |

Test hook: `window.__pp` exposes `S, b, AIS, W, MK, BOATS, run(seconds), render(), snapCam(), cc` (= `checkCourse`), `depthAt, windAt, lapsAt, makeLegs, setBoat, startRace` and more. `__pp.run(t)` steps the sim at 1/60 s without waiting for real time. Use it.

## 4. How the simulation works

**Units.** 1 world unit ≈ 45 m. Board is X −130…112, Z −90…55 (north is −Z). Boats are drawn about 40× real size so they're visible. Speeds are real knots; `K = 0.2` world units per second per knot, so time runs about 17× real.

**Compass.** Bearings are degrees clockwise from north. A heading `h` points along `(sin h, 0, −cos h)`. Wind direction `twd` is where the wind comes **from** (meteorological, same as Open-Meteo). `side` = +1 starboard tack (wind from the right), −1 port.

**Polars.** `polar(B, twa, tws)` = shape factor by true wind angle × class speed curve `B.vb(tws)`. Inside the no-go zone speed falls to zero. Sabre: points high, steady. Tornado: fastest, poor in irons. Windsurfer: planes above about 13 kn (sigmoid in `vb`). `vmgAngles` finds best upwind/downwind angles numerically (cached).

**Physics (`sail`).** Steering rate scales with speed; speed eases toward the polar target (separate accel, decel and in-irons rates per class); leeway and in-irons drift; board-edge clamp; pier collisions (blocked only if moving closer, so you can always back off); mark contact; grounding. **Grounding rule:** a move is blocked only if it makes the boat *shallower* than its draft (`dNew < r.depth - 1e-4`). An earlier version used `<=` plus a tolerance and boats could never float off. Don't regress that.

**Course progress (`advance`).** Line crossings use segment intersection with direction (`crossed()` returns ±1 along `CD`). Mark roundings accumulate signed bearing change while within 32 units; ≤ −200° counts as a port rounding (anticlockwise seen from above). ≥ +150° flags "wrong way round". Legs come from `makeLegs(laps, d)`: `start, gateOut, far, gateIn, [home, gateOut, far, gateIn,] finish`.

**Laps.** `lapsAt(tws)` compares each class's `courseSpeed` with the Sabre's at the preset's typical wind, rounds, clamps to 1–2. Typically Sabre 1, Tornado 2, windsurfer 2 except in light wind.

## 5. AI and rules

- **`aiGoal`** picks a target point per leg. Line legs use `crossGoal()`, which aims through the line, and if the boat is past without crossing, sends it back round (fixes boats that sailed round the end of a line and circled forever). Mark roundings use four waypoints round the mark, and the waypoint index loops if the rounding didn't register.
- **Pre-start:** AI holds behind its line, then approaches a spot 1.5 units behind and **luffs** (heads near the wind to stall) until the gun, with a per-boat `late` offset. This took early starters from 11/19 to 0.
- **`aiPlan`** samples 61 headings, scores VMC (velocity made good toward the target), rejects headings that `clearAhead()` finds shallow, near piers or near marks, and applies tack hysteresis (it won't switch tack unless the other is about 22% better). Replans every 0.35 s.
- **`avoid`** looks for collision courses within 5 s; if this boat must keep clear (`keepClear`), it steers ±28/50° away for about a second.
- **`bumps`** separates overlapping boats and assigns fouls via `keepClear`: port/starboard, clear astern, windward. Penalties don't stack on a boat already doing turns, and the same pair can't foul more than once in 12 s. (Before that fix one boat owed 6,480°.)
- **Not modelled:** room at marks (rule 18), the overlap timing in rule 12, protests. Mark pile-ups get judged on port/starboard and windward alone.
- AI skill is a 0.90–0.988 multiplier on polar speed.

## 6. Leaderboard (Supabase)

- Project **"M2 Projects"** (`qvnmvyfmbxgrghhxlqcl`, Singapore region), Mick's separate Supabase account. Table `public.csi_scores`, schema in `supabase/leaderboard.sql`, plus a later column `start_end text check in ('rye','rosebud') default 'rye'` and index `(class, wind, start_end, time_s)`.
- RLS: anon and authenticated can **select** and **insert** only. No update or delete through the API (tested). Check constraints reject times under 60 s or over 7200 s, names over 24/20 characters, and unknown classes or winds.
- Client: `LB` holds the URL and the **publishable** key (`sb_publishable_…`, public by design). It is only enabled when the hostname matches `vercel.app`, `localhost` or `test.local`. Requests send the `apikey` header only, no `Authorization` header.
- Boards are keyed by class + wind bucket + start end. Live and forecast wind map to light/moderate/fresh via `lbWind()`.
- Known leftover: one test row ("Probe", skipper "Test", 6:40.0, Sabre, moderate, Rye) may still be on the board. A delete through the Supabase tool was cancelled. Remove it in the Supabase table editor if Mick hasn't.
- Anyone can post a fake time. Proper fix: a server function that validates a run. Not built.

## 7. Real wind (Open-Meteo)

- `WX_URL` is Open-Meteo's forecast API at −38.37, 144.88 (just off Capel Sound), knots, Australia/Melbourne time, 16 days hourly plus `current`. No API key.
- **Live now** uses `current`; **Event forecast** uses the hourly entry matching the chosen hour. `?event=YYYY-MM-DDTHH:00` in the URL presets the event time and selects that wind (for sharing race-day links). The event time is also kept in localStorage.
- These presets fix the base direction and speed and scale gust strength from the gust/speed ratio. The usual shifts still run on top.
- **Unverified from the build environment:** the sandbox couldn't reach Open-Meteo, so this was tested with a stand-in response in the documented shape. If it fails on the live site the chips show "unavailable" and the game falls back to Moderate. It's model data, not station observations.

## 8. UI and layout notes

- Design tokens are on `:root` (light) with dark-mode overrides; fonts are Instrument Serif (display), Figtree (UI), JetBrains Mono (numbers). Same family of look as Mick's other games (Floor Shift, Tail Swing/Forking Fun).
- Breakpoints:
  - `max-width:760px`: phone portrait.
  - `max-height:520px and landscape`: phone landscape, compact: no masthead, small race card, scaled instruments, icon-only camera buttons. Mick asked for this after the desktop layout swamped his phone.
  - `pointer:coarse`: touch controls.
- **Mini chart:** on phones the canvas is moved out of the race card into a floating see-through map (`placeMap`, class `ghostmap`); tap to enlarge.
- **Countdown:** a big "0:26 to the gun" clock, then giant 10…1 and "Go!".
- Default camera distance `CAMD()` = 31 desktop / 50 phone (Mick wanted it two zoom steps out).
- Restart: button on the race card or `R`, tap twice within 3 s.

## 9. Testing

`tests/race-sim.mjs` loads the page in headless Chromium (swiftshader WebGL), blocks the network apart from serving `index.html` and Three.js from `node_modules`, starts a race and fast-forwards with `__pp.run`. Args: boat, wind, minutes. Healthy output: no page errors, legs climbing for both fleets, `finished` rising after about 5–8 sim minutes, `aground` small and transient.

Other checks used during the build (worth repeating after big changes):
- Screenshots at 1400×860, 412×915 (portrait), 915×412 and 844×390 (landscape).
- Driving the player through each leg with `__pp.cc(px,pz,nx,nz)` to test line and rounding logic.
- Simulating 10–14 minutes of a full race per class and wind to catch stuck AI.

Don't trust a change to the AI or course until a full sim shows every boat finishing.

## 10. Deploy

- Vercel project `capelsoundinvitational` (team slug `mick-club-roster-project`) is git-connected. Push to `main` and it's live in about a minute. Password and SSO protection are **off** (Mick wants it public).
- Commit author used: Mick Russell <mick@mickrussell.com>.
- Rollback: Vercel dashboard → Deployments → Instant Rollback.

## 11. History of decisions (so you don't undo them)

1. Started as "Pier to Pier", Rye → Rosebud → Rye single fleet. Renamed **Capel Sound Invitational 2026** at Mick's request.
2. Steering is left/right + tack/gybe only; sails trim themselves. Keep it simple for touch.
3. Sandbanks and depths are **invented** (no chart data). The coastline is traced. Never present the banks as navigation info.
4. Competitors: one class first, then mixed classes on Mick's request. He chose **extra laps for faster boats** over a time handicap.
5. Two-fleet format, start boat at the beach end, pin = the other fleet's rounding mark, shared gate, round-trip home: all Mick's own race design.
6. Rules enforced from the gun, with real penalty turns for player and AI.
7. Waves, the big countdown, the compact landscape layout and the phone map all came from Mick playing it on his phone.
8. Second lap: round your own start mark, don't re-cross the line.

## 12. Known gaps and likely next asks

- No room-at-marks rule; AI mark roundings can be scrappy in big pile-ups.
- On desktop with 2 laps the race card lists 10 legs and pushes the wind chart down. Collapsing finished legs was offered, not done.
- Leaderboard has no anti-cheat.
- Weather fetch unverified on the live domain (see 7).
- Performance: 20 boats, about 50k-vertex water and per-frame instancing. Fine on recent phones; older phones may struggle. Lower the water grid in `wgeo` or the streak count `NSTR` first.
- Sibling game in the same style: Forking Fun / Tail Swing (forklift safety drill), repo `mick-cmyk/forkingfun`, live at forkingfun.vercel.app.

## 13. Working with Mick

He's direct and plays on his phone; screenshots of problems are his bug reports. He wants changes shipped live (push to `main`), not described. Australian English, no em dashes, no agency-speak. He has standing permission for you to ask a short clarifying question when a request is genuinely ambiguous (for example "2x more laps" turned out to mean extra laps for faster boats, not a longer course for everyone). Ask rather than guess on course and format changes; just do it on visual polish.
