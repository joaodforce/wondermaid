'use server';

import { fetchPlayerData, extractNoelleData } from '@/lib/enka/client';
import { parseNoelleArtifactStats, parseNoelleWeapon, parseArtifactSetId } from '@/lib/enka/mapper';
import { calculateNoelleDamage } from '@/lib/calculator/noelle';
import { db } from '@/lib/db';
import { players, noelleBuilds, leaderboardRanks, scenarios } from '@/lib/db/schema';
import { crypto } from 'crypto';

export async function processPlayerUpdate(uid: string) {
  if (!uid || uid.length < 8) {
    return { success: false, error: 'UID inválido.' };
  }

  // 1. Obter dados do Enka Network
  const enkaData = await fetchPlayerData(uid);
  if (!enkaData) {
    return { success: false, error: 'Não foi possível obter dados do Enka API.' };
  }

  const noelleAvatar = extractNoelleData(enkaData);
  if (!noelleAvatar) {
    return { success: false, error: 'Noelle não encontrada nos detalhes da conta do utilizador.' };
  }

  // 2. Extrair dados da build
  const nickname = enkaData.playerInfo.nickname || `UID_${uid}`;
  const profilePictureId = enkaData.playerInfo.profilePicture?.avatarId || 10000034;
  const artifactStats = parseNoelleArtifactStats(noelleAvatar);
  const { weaponConfig, weaponId, refinement } = parseNoelleWeapon(noelleAvatar);
  const artifactSetId = parseArtifactSetId(noelleAvatar);

  const buildId = globalThis.crypto.randomUUID();

  try {
    // 3. Atualizar/Inserir registo do jogador
    await db.insert(players)
      .values({
        uid,
        nickname,
        profilePictureId,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: players.uid,
        set: { nickname, profilePictureId, updatedAt: new Date() }
      });

    // 4. Guardar snapshot da build da Noelle
    await db.insert(noelleBuilds).values({
      id: buildId,
      uid,
      weaponId,
      weaponRefinement: refinement,
      artifactSetIds: [artifactSetId],
      statsJson: artifactStats,
      calculatedAt: new Date()
    });

    // 5. Obter cenários registados na base de dados
    const activeScenarios = await db.select().from(scenarios);

    // Se ainda não houver cenários, criar um por defeito
    if (activeScenarios.length === 0) {
      const defaultScenario = {
        id: 'mono-geo-c6-gorou',
        name: 'Mono Geo (Gorou C6)',
        attackType: 'Na4' as const,
        teamConfigJson: { geoResonance: true, gorouC6: true }
      };
      await db.insert(scenarios).values(defaultScenario);
      activeScenarios.push(defaultScenario);
    }

    // 6. Recalcular e atualizar classificações para cada cenário
    for (const scenario of activeScenarios) {
      const calcResult = calculateNoelleDamage(
        artifactStats,
        artifactSetId,
        weaponConfig,
        scenario.teamConfigJson as any,
        scenario.attackType as any
      );

      await db.insert(leaderboardRanks)
        .values({
          uid,
          scenarioId: scenario.id,
          buildId,
          finalDamage: calcResult.finalDamage,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [leaderboardRanks.uid, leaderboardRanks.scenarioId],
          set: {
            buildId,
            finalDamage: calcResult.finalDamage,
            updatedAt: new Date()
          }
        });
    }

    return { success: true, message: 'Classificação atualizada com sucesso!' };
  } catch (err: any) {
    console.error('Erro ao processar atualização:', err);
    return { success: false, error: err.message || 'Erro ao guardar dados na BD.' };
  }
}