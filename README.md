# Noelle Mains Leaderboard

Ranks Genshin Impact Noelle builds by expected damage in her current meta teams. Players submit their UID, the app
reads Noelle from their [Enka.Network](https://enka.network) showcase, runs her build through a damage calculator
for every team scenario and ranks it against everyone else.

## How it works

1. `processPlayerUpdate` (server action, `src/app/actions/update-player.ts`) validates the UID.
2. `fetchPlayerData` (`src/modules/enka/client.ts`) gets the showcase from Enka, cached in Upstash Redis for 5 minutes.
3. The mapper (`src/modules/enka/mapper.ts`) turns Noelle's `fightPropMap`, weapon and artifacts into a `NoelleBuild`.
4. `calculateNoelleDamage` (`src/modules/calculator/noelle.ts`) computes her damage for each active scenario.
5. `updatePlayerFromEnka` (`src/modules/leaderboard/services.ts`) stores the player, the build and one rank per
   scenario in PostgreSQL. `GET /api/leaderboard?scenarioId=...` returns the top 100.

### Damage model

Enka's `fightPropMap` already includes level, ascension, weapon stats, static weapon passives (e.g. Redhorn's DEF%),
artifact stats and 2-piece stat bonuses. The calculator only adds what the character sheet can't show:

- **Noelle**: everyone is treated as C6 with burst level 13 (135% DEF to ATK), C2's Charged Attack bonus and fixed
  motion values (N4 224.2%, CA 100.3%, plunge 368.2%), so only gear decides the ranking.
- **Weapons**: Whiteblind (4 stacks, Normal/Charged only), Serpent Spine (5 stacks), Redhorn's DEF-based flat DMG
  (not on plunges), all by refinement.
- **Artifacts**: Husk of Opulent Dreams (4 stacks), Marechaussee Hunter (2-piece, and 3 stacks with Furina),
  Gladiator's Finale, Nighttime Whispers, Night of the Sky's Unveiling.
- **Team** (`src/modules/calculator/team.ts`): Geo Resonance, Gorou, Furina's Fanfare, Yelan, Zhongli, Xianyun's
  plunge buffs and Crane's Echoing Call, Columbina and Linnea (Lunar Crystallize).
- **Enemy**: level 100 with 10% base RES.

The result is the crit-averaged damage of one hit.

## Scenarios

Scenarios live in the `scenarios` table. The defaults in `src/modules/leaderboard/scenarios.ts` are inserted on first
use and never overwritten, so a scenario can be edited (`team_config_json`, see `TeamConfig` in
`src/modules/calculator/types.ts`) or hidden (`is_active = false`) in the database. After changing scenarios or the
calculator, run `npm run leaderboard:recalculate` to recompute every rank from the stored builds.

## Getting started

```bash
cp .env.example .env   # set DATABASE_URL, and the Upstash credentials if you have them
npm install
npm run db:migrate
npm run dev
```

| Script | |
| :-- | :-- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm test` | Calculator and Enka mapper unit tests |
| `npm run db:generate` | Create a migration in `drizzle/` from `src/db/schema` |
| `npm run db:migrate` | Apply migrations |
| `npm run leaderboard:recalculate` | Recompute all ranks |
| `npm run leaderboard:backfill` | Fetch ranks from Enka for players that have none (`-- --all` for everyone) |
