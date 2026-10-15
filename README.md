# Capel Sound Invitational 2026

A 3D sailing race on the southern shore of Port Phillip. Two fleets start on the same gun: one off Rye, one off Rosebud (start boats at the beach end of each line). Each fleet goes through the shared gate off Capel Sound, rounds the other fleet's start mark (the pin end of its line) to port, comes home through the gate and finishes on its own line. Racing rules apply from the gun (port/starboard, windward boat, clear astern): a foul costs 720°, touching a mark 360°. Boats ride a wave surface that grows with the wind. 19 rival boats race you in a mixed fleet of Sabres, Tornados and windsurfers. Faster classes sail 2 laps, the rest 1, and first boat home wins.

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
Skippers enter their name and boat name. Finishing times post to a Supabase table (`supabase/leaderboard.sql`). Supabase project M2 Projects. The leaderboard only runs on the vercel.app domain (`LB` in `index.html`); the publishable key is public by design and the table only allows reading and adding scores.

## Real wind
Wind options include **Live now** (current Capel Sound wind) and **Event forecast** (hourly forecast for a chosen time, up to 16 days out), both from Open-Meteo. Share a link with the race time set: `https://capelsoundinvitational.vercel.app/?event=2026-10-25T14:00`.
