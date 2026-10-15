# Capel Sound Invitational 2026

A 3D sailing race on the southern shore of Port Phillip. Start off Rye Pier, go out through the gate off Capel Sound, round the Rosebud mark keeping it to port, come back through the gate and finish at Rye. 19 rival boats race you in a mixed fleet of Sabres, Tornados and windsurfers. Faster classes sail 2 laps, the rest 1, and first boat home wins.

- Boats: Sabre, Tornado or windsurfer
- Wind presets: Light, Moderate, Fresh, Building, Shifty. The wind swings and builds or eases during the race.
- Sandbanks and depths are made up for the game, not from a chart. The coastline is traced from satellite imagery.
- Time runs about 17x real speed.

Single static `index.html`. Three.js r128 loads from jsDelivr. No build step.

## Controls
- ← / → or A / D: steer
- Space: tack or gybe
- Scroll, + / −: zoom. V: whole course. C: camera mode. L: laylines
- R twice: restart the race
- Touch: on-screen steer, tack, zoom and restart buttons

Live: https://capelsoundinvitational.vercel.app (pushes to `main` deploy automatically)

## Leaderboard
Skippers enter their name and boat name. Finishing times post to a Supabase table (`supabase/leaderboard.sql`). It stays off until `LB.url` and `LB.key` are set in `index.html`.
