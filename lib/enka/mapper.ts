import { EnkaAvatar } from './client';
import { WeaponConfig } from '../calculator/types';

// Mapeamento dos IDs de armas do Enka para nomes conhecidos
const WEAPON_NAME_MAP: Record<number, string> = {
  12406: "Whiteblind",
  12409: "SerpantSpine",
  12510: "Redhorn",
};

export function parseNoelleArtifactStats(avatar: EnkaAvatar): Record<string, number> {
  const stats: Record<string, number> = {};
  const fightProps = avatar.fightPropMap || {};

  // Propriedades padrão do Enka
  stats["FIGHT_PROP_CRITICAL"] = (fightProps[20] || 0) * 100; // Crit Rate
  stats["FIGHT_PROP_CRITICAL_HURT"] = (fightProps[22] || 0) * 100; // Crit DMG
  stats["FIGHT_PROP_CHARGE_EFFICIENCY"] = (fightProps[23] || 0) * 100; // ER
  stats["FIGHT_PROP_ROCK_ADD_HURT"] = (fightProps[30] || 0) * 100; // Geo DMG
  stats["FIGHT_PROP_ATTACK_PERCENT"] = (fightProps[6] || 0) * 100;
  stats["FIGHT_PROP_DEFENSE_PERCENT"] = (fightProps[9] || 0) * 100;
  stats["FIGHT_PROP_ATTACK"] = fightProps[5] || 0;
  stats["FIGHT_PROP_DEFENSE"] = fightProps[8] || 0;
  stats["FIGHT_PROP_ELEMENT_MASTERY"] = fightProps[28] || 0;

  return stats;
}

export function parseNoelleWeapon(avatar: EnkaAvatar): { weaponConfig: WeaponConfig; weaponId: number; refinement: number } {
  const weaponEquip = avatar.equipList?.find(e => e.flat?.itemType === "ITEM_WEAPON");
  
  if (!weaponEquip) {
    return {
      weaponId: 0,
      refinement: 1,
      weaponConfig: { weaponName: "Whiteblind", baseAtk: 510 }
    };
  }

  const weaponId = weaponEquip.itemId;
  const weaponName = WEAPON_NAME_MAP[weaponId] || "Unknown";
  const refinement = (weaponEquip.weapon?.affixMap ? Object.values(weaponEquip.weapon.affixMap)[0] as number : 0) + 1;
  
  const baseAtk = weaponEquip.flat?.weaponStats?.find((s: any) => s.appendPropId === "FIGHT_PROP_BASE_ATTACK")?.statValue || 510;
  const subStat = weaponEquip.flat?.weaponStats?.find((s: any) => s.appendPropId !== "FIGHT_PROP_BASE_ATTACK");

  return {
    weaponId,
    refinement,
    weaponConfig: {
      weaponName,
      baseAtk,
      subStatType: subStat?.appendPropId,
      subStatValue: subStat?.statValue ? subStat.statValue / 100 : 0
    }
  };
}

export function parseArtifactSetId(avatar: EnkaAvatar): number {
  const sets: Record<number, number> = {};
  
  avatar.equipList?.forEach(e => {
    if (e.flat?.itemType === "ITEM_RELIQUARY" && e.flat?.setId) {
      const setId = e.flat.setId;
      sets[setId] = (sets[setId] || 0) + 1;
    }
  });

  // Retorna o ID do conjunto de 4 peças, se existir
  for (const [setId, count] of Object.entries(sets)) {
    if (count >= 4) return Number(setId);
  }
  
  return 0;
}