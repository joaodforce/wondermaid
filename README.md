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
- **Fixed weapon per team**: every build is ranked with its team's weapon (`scenarios.weapon_id` /
  `weapon_refinement`, Redhorn Stonethresher R1 by default), so only artifacts decide the order. The player's own
  weapon's base ATK, substat and static passive are taken out of Enka's totals and the fixed weapon's are put in
  (`src/modules/calculator/weapons.ts`). Redhorn, Whiteblind and Serpent Spine can be assigned.
- **Weapons**: Whiteblind (4 stacks, Normal/Charged only), Serpent Spine (5 stacks), Redhorn's DEF-based flat DMG
  (not on plunges), all by refinement.
- **Artifacts**: Husk of Opulent Dreams (4 stacks), Marechaussee Hunter (2-piece, and 3 stacks with Furina),
  Gladiator's Finale, Nighttime Whispers, Night of the Sky's Unveiling.
- **Team** (`src/modules/calculator/team.ts`): Geo Resonance, Gorou, Furina's Fanfare, Yelan, Zhongli, Xianyun's
  plunge buffs and Crane's Echoing Call, Columbina and Linnea (Lunar Crystallize).
- **Enemy**: level 100 with 10% base RES.

The result is the crit-averaged damage of one hit.

Every buff is recorded with its source as it's applied (`BuffLedger` in `src/modules/calculator/team.ts`), and
`explainNoelleDamage` returns each intermediate value. The ranked number is derived from that same explanation, and
`/{uid}/calc/{scenarioId}` (linked from every damage number) shows it step by step so members can audit the math.

## Scenarios

Scenarios live in the `scenarios` table. The defaults in `src/modules/leaderboard/scenarios.ts` are inserted on first
use and never overwritten, so a scenario can be edited (`team_config_json`, see `TeamConfig` in
`src/modules/calculator/types.ts`) or hidden (`is_active = false`) in the database. After changing scenarios or the
calculator, ranks are recomputed from the stored builds when the Docker image boots (or run
`npm run leaderboard:recalculate`).

The full Enka response from each player's latest update is kept in `enka_profiles.response_json`, so new features can
use fields we don't parse yet without players updating again.

## Getting started

```bash
cp .env.example .env   # set DATABASE_URL, and the Upstash credentials if you have them
docker compose up -d   # local PostgreSQL, matching the default DATABASE_URL
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

## Deploying

### Environments

| Branch | Environment | Image tags on `ghcr.io/joaodforce/wondermaid` | Site |
| :-- | :-- | :-- | :-- |
| `staging` | PRE | `:X.Y.Z`, `:staging`, `:sha-<short>` | e.g. `staging.wondermaid.app` |
| `master` | PROD | `:latest`, `:sha-<short>` | `wondermaid.app` |

`.github/workflows/deploy.yml` builds and pushes the Docker image on every push to `staging` or `master`. Merge PRs into
`staging`, check PRE, then merge `staging` into `master` to ship the same version to PROD.

Every push to `staging` cuts a release: `scripts/release-version.mjs` reads the
[Conventional Commits](https://www.conventionalcommits.org/) since the last `vX.Y.Z` tag (`feat:` → minor,
`BREAKING CHANGE:` or `type!:` → major, anything else → patch). After the image is pushed, the workflow commits the bump
as `chore(release): vX.Y.Z` and pushes the tag. Pushes to `master` don't bump; they ship the version from `staging`.
Run `node scripts/release-version.mjs` locally to preview the next version.

The version, commit and environment (PRE / PROD) are baked into the image and shown in the bottom-right corner of the
site, so you can tell which release is live.

One-time GitHub setup: create the `staging` branch, and under **Settings → Actions → General → Workflow permissions**
allow read and write so the workflow can push the release commit, tag and image.

### Run it

The image runs pending migrations on boot (`docker-entrypoint.sh`, retried `MIGRATION_RETRIES` times, default 5;
`SKIP_MIGRATIONS=true` skips them), recalculates every rank so calculator and scenario changes apply to existing
players (`SKIP_RECALCULATION=true` skips it) and then starts the standalone Next.js server on port 3000. Give each environment
its own database and env file (never committed):

```bash
# PROD
docker run -d --name wondermaid --restart unless-stopped \
  --env-file .env.production -p 127.0.0.1:3000:3000 ghcr.io/joaodforce/wondermaid:latest

# PRE
docker run -d --name wondermaid-staging --restart unless-stopped \
  --env-file .env.staging -p 127.0.0.1:3001:3000 ghcr.io/joaodforce/wondermaid:staging

# Pull new :latest / :staging images automatically
docker run -d --name watchtower --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower wondermaid wondermaid-staging
```

Put a reverse proxy (Caddy, nginx) or a Cloudflare Tunnel in front, e.g. with Caddy:

```
wondermaid.app {
    reverse_proxy 127.0.0.1:3000
}

staging.wondermaid.app {
    reverse_proxy 127.0.0.1:3001
}
```

The `tools` image target has the full source for one-off jobs:

```bash
docker build --target tools -t wondermaid-tools .
docker run --rm --env-file .env.production wondermaid-tools npm run leaderboard:recalculate
```
