/* eslint-disable @next/next/no-img-element -- rendered to PNG by next/og, which only understands plain <img> */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { formatArtifactSets, formatNumber, formatPercent, formatStatValue, statLabel } from '@/lib/format';
import { enkaIconUrl, weaponName } from '@/modules/calculator/data';
import type { ArtifactPiece } from '@/modules/calculator/types';
import type { PlayerBuildPage } from './types';

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

const COLORS = { olive: '#8a825e', ink: '#17150f', panel: '#211e16', muted: '#a8a29e', text: '#f5f5f4', gold: '#fcd34d' };

// Read once per server process (assets/card is traced into the standalone build, see next.config.ts)
const assets = (async () => {
  const dir = join(process.cwd(), 'assets/card');
  const [regular, semiBold, black, art] = await Promise.all(
    ['Geist-Regular.ttf', 'Geist-SemiBold.ttf', 'Geist-Black.ttf', 'noelle.jpg'].map((file) => readFile(join(dir, file))),
  );
  return {
    fonts: [
      { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Geist', data: semiBold, weight: 600 as const, style: 'normal' as const },
      { name: 'Geist', data: black, weight: 900 as const, style: 'normal' as const },
    ],
    art: `data:image/jpeg;base64,${art.toString('base64')}`,
  };
})();

const iconCache = new Map<string, Promise<string | null>>();

// Enka icons are inlined so a slow or missing icon leaves a gap instead of failing the whole image
function enkaIcon(icon: string | undefined): Promise<string | null> {
  if (!icon) return Promise.resolve(null);
  let cached = iconCache.get(icon);
  if (!cached) {
    cached = fetch(enkaIconUrl(icon), { signal: AbortSignal.timeout(3000) })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return `data:image/png;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
      })
      .catch((error) => {
        console.warn(`[share-card] icon ${icon} unavailable:`, error instanceof Error ? error.message : error);
        iconCache.delete(icon);
        return null;
      });
    iconCache.set(icon, cached);
  }
  return cached;
}

const critValue = (piece: ArtifactPiece) =>
  piece.subStats.reduce(
    (sum, stat) =>
      sum + (stat.type === 'FIGHT_PROP_CRITICAL' ? stat.value * 2 : stat.type === 'FIGHT_PROP_CRITICAL_HURT' ? stat.value : 0),
    0,
  );

/** One-image summary of a player's Noelle for sharing: stats, gear and their rank on every team. */
export async function renderShareCard(player: PlayerBuildPage, headers?: HeadersInit): Promise<ImageResponse> {
  const { build } = player;
  const artifacts = build.artifacts ?? [];
  const [{ fonts, art }, weaponIcon, ...artifactIcons] = await Promise.all([
    assets,
    enkaIcon(build.weapon.icon),
    ...artifacts.map((piece) => enkaIcon(piece.icon)),
  ]);
  const totalCv = artifacts.reduce((sum, piece) => sum + critValue(piece), 0);
  // Ranks use each team's fixed weapon rather than the equipped one, so say which
  const rankWeapons = new Set(player.scenarios.map((s) => `${weaponName(s.weapon.id)} R${s.weapon.refinement}`));
  const rankingsLabel = rankWeapons.size === 1 ? `Team rankings · all with ${[...rankWeapons][0]}` : 'Team rankings';

  const stats = [
    { label: 'DEF', value: formatNumber(build.stats.def) },
    { label: 'ATK', value: formatNumber(build.stats.atk) },
    { label: 'CRIT Rate', value: formatPercent(build.stats.critRate) },
    { label: 'CRIT DMG', value: formatPercent(build.stats.critDmg) },
    { label: 'Geo DMG', value: formatPercent(build.stats.geoDmgBonus) },
    { label: 'Energy Recharge', value: formatPercent(build.stats.energyRecharge) },
  ];

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: COLORS.olive, fontFamily: 'Geist' }}>
        <div style={{ display: 'flex', position: 'relative', width: 440, height: 630 }}>
          <img src={art} width={440} height={630} alt="" />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              left: 28,
              bottom: 24,
              color: COLORS.ink,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 600 }}>{`Noelle · Lv. ${build.level} · C${build.constellation}`}</span>
            <span style={{ fontSize: 18 }}>wondermaid.app</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            margin: '24px 24px 24px 0',
            padding: 28,
            gap: 18,
            borderRadius: 24,
            background: COLORS.ink,
            color: COLORS.text,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{player.nickname}</span>
              <span style={{ fontSize: 17, color: COLORS.muted, marginTop: 6 }}>
                {`UID ${player.uid}${player.level != null ? ` · AR ${player.level}` : ''}`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 14, color: COLORS.muted }}>Crit Value</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: COLORS.gold, lineHeight: 1 }}>{totalCv.toFixed(1)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {weaponIcon && <img src={weaponIcon} width={52} height={52} alt="" style={{ borderRadius: 10, background: '#945c2c' }} />}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 19, fontWeight: 600 }}>
                {`${weaponName(build.weapon.id)} R${build.weapon.refinement}`}
              </span>
              <span style={{ fontSize: 15, color: COLORS.muted }}>{formatArtifactSets(build.artifactSets)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 12,
                  background: COLORS.panel,
                }}
              >
                <span style={{ fontSize: 12, color: COLORS.muted }}>{stat.label}</span>
                <span style={{ fontSize: 20, fontWeight: 600 }}>{stat.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ width: '100%', fontSize: 13, color: COLORS.muted }}>{rankingsLabel}</span>
            {player.scenarios.slice(0, 4).map((scenario) => (
              <div
                key={scenario.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: 334,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: COLORS.panel,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{scenario.name}</span>
                  <span style={{ fontSize: 14, color: COLORS.muted }}>
                    {scenario.rank ? `#${scenario.rank} of ${scenario.total}` : 'Unranked'}
                  </span>
                </div>
                <span style={{ fontSize: 30, fontWeight: 900, color: COLORS.gold }}>{formatNumber(scenario.finalDamage)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            {artifacts.map((piece, index) => (
              <div
                key={piece.slot}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  height: 128,
                  padding: '8px 10px',
                  borderRadius: 12,
                  background: COLORS.panel,
                }}
              >
                {artifactIcons[index] ? (
                  <img src={artifactIcons[index]!} width={52} height={52} alt="" />
                ) : (
                  <div style={{ display: 'flex', height: 52 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, color: COLORS.muted }}>{statLabel(piece.mainStat.type)}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{formatStatValue(piece.mainStat.type, piece.mainStat.value)}</span>
                  <span style={{ fontSize: 11, color: COLORS.gold }}>{`CV ${critValue(piece).toFixed(1)}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...SHARE_CARD_SIZE, fonts, headers },
  );
}
