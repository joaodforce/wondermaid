# Vendored Genshin Optimizer calculation engine

Source: https://github.com/frzyc/genshin-optimizer at commit `cbee3af79d465735736cfbfbeaa6a9f89bea46dd`, MIT licensed (see `LICENSE`).

Copied as-is, without tests, executors and generators:

| Path | Package |
| :-- | :-- |
| `libs/pando/engine` | Pando calculation engine |
| `libs/game-opt/engine`, `libs/game-opt/formula` | Game-agnostic optimizer layers |
| `libs/common/util` | Shared helpers |
| `libs/gi/consts`, `libs/gi/stats` | Genshin keys and datamined numbers |
| `libs/gi/formula` | Genshin characters, weapons and artifact sets on Pando |
| `types/object-overrides` | Global `Object.keys/values/entries` typings the engine relies on |

Shims (not from GO): `libs/gi/dm` and `libs/gi/good` hold only the types the engine imports from them, and
`libs/gi/stats/src/executors/gen-stats/executor.ts` spells out the stats JSON types GO's generator would emit.
The `@genshin-optimizer/*` import paths are mapped in the root `tsconfig.json`.

To update:

1. Sparse-clone GO at a newer commit and copy each library's `src` folder over the one here (skip `*.test.ts`),
   keeping the shims above.
2. `npx tsc --noEmit` and `npm test`. The preset test fails if a conditional the app relies on was renamed.
3. Map any new characters, weapons or artifact sets from their Enka IDs in `src/modules/go/keys.ts`.
4. Update the commit above.
