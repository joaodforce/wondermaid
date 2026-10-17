import { AttackType, WeaponConfig, TeamConfig, CalculationResult } from './types';

const NOELLE_BASE = {
  baseHp: 12071,
  baseAtk: 191,
  baseDef: 799
};

const ENEMY_DEF_MULTIPLIER = 0.487;
const NOELLE_Q_DEF_SCALING = 1.35;

export function calculateNoelleDamage(
  artifactStats: Record<string, number>,
  artifactSetId: number,
  weaponConfig: WeaponConfig,
  teamConfig: TeamConfig,
  attackType: AttackType
): CalculationResult {
  
  let motionValue = 2.242; // Default Na4[cite: 3]
  if (attackType === "Ca") motionValue = 1.003; //[cite: 3]
  if (attackType === "Plunge") motionValue = 3.682; //[cite: 3]

  let totalATK = NOELLE_BASE.baseAtk;
  let totalDEF = NOELLE_BASE.baseDef + (0.3 * NOELLE_BASE.baseDef); // 30% DEF Ascension[cite: 3]
  let totalCritRate = 5 + (artifactStats["FIGHT_PROP_CRITICAL"] || 0); //[cite: 3]
  let totalCritDMG = 50 + (artifactStats["FIGHT_PROP_CRITICAL_HURT"] || 0); //[cite: 3]
  let totalER = 0.1 * (artifactStats["FIGHT_PROP_CHARGE_EFFICIENCY"] || 0); //[cite: 3]
  let totalGeoDMG = (artifactStats["FIGHT_PROP_ROCK_ADD_HURT"] * 0.01) || 0; //[cite: 3]
  let totalEM = artifactStats["FIGHT_PROP_ELEMENT_MASTERY"] || 0; //[cite: 3]
  
  let totalDamageBonus = 0;
  let flatDamage = 0;
  let enemyRes = 0.1; //[cite: 3]
  let totalReactionDmg = 0; //[cite: 3]
  let elevation = 1; //[cite: 3]

  // 1. Weapon Stats & Passives[cite: 3]
  totalATK += weaponConfig.baseAtk;
  if (weaponConfig.subStatType === "FIGHT_PROP_DEFENSE_PERCENT") {
    totalDEF += NOELLE_BASE.baseDef * (weaponConfig.subStatValue || 0);
  } else if (weaponConfig.subStatType === "FIGHT_PROP_CRITICAL") {
    totalCritRate += weaponConfig.subStatValue || 0;
  } else if (weaponConfig.subStatType === "FIGHT_PROP_CRITICAL_HURT") {
    totalCritDMG += weaponConfig.subStatValue || 0;
  }

  if (weaponConfig.weaponName === "Whiteblind") {
    totalATK += (NOELLE_BASE.baseAtk + weaponConfig.baseAtk) * 0.36; //[cite: 3]
  }
  if (weaponConfig.weaponName === "SerpantSpine") {
    totalDamageBonus += 0.5; //[cite: 3]
    if (artifactSetId === 15021) {
      totalDEF -= (NOELLE_BASE.baseDef * 0.24); //[cite: 3]
    }
  }
  if (weaponConfig.weaponName === "Redhorn") {
    totalDEF += NOELLE_BASE.baseDef * 0.28; //[cite: 3]
  }

  // 2. Artifact Percentage & Flat Stats[cite: 3]
  totalATK += (NOELLE_BASE.baseAtk + weaponConfig.baseAtk) * ((artifactStats["FIGHT_PROP_ATTACK_PERCENT"] || 0) / 100);
  totalDEF += NOELLE_BASE.baseDef * ((artifactStats["FIGHT_PROP_DEFENSE_PERCENT"] || 0) / 100);
  totalER += (artifactStats["FIGHT_PROP_CHARGE_EFFICIENCY"] || 0) / 100;
  
  totalATK += artifactStats["FIGHT_PROP_ATTACK"] || 0;
  totalDEF += artifactStats["FIGHT_PROP_DEFENSE"] || 0;

  // 3. Artifact Set Effects[cite: 3]
  if (artifactSetId === 15021) { // Husk
    totalDEF += NOELLE_BASE.baseDef * 0.54; //[cite: 3]
    totalGeoDMG += 0.24; //[cite: 3]
  } else if (artifactSetId === 15031) { // Marechaussee
    if (teamConfig.furinaC0 || teamConfig.furinaC1 || teamConfig.furinaC2 || teamConfig.furinaC3) {
      totalCritRate += 36; //[cite: 3]
    }
    if (attackType !== "Plunge") totalDamageBonus += 0.15; //[cite: 3]
  } else if (artifactSetId === 15041) { // Night of Sky's Unveiling
    totalEM += 80; //[cite: 3]
    const count = teamConfig.nodKraiCount || 0; //[cite: 3]
    if (count === 2) {
      totalCritRate += 30; //[cite: 3]
      totalReactionDmg += 0.1; //[cite: 3]
    } else if (count === 1) {
      totalCritRate += 15; //[cite: 3]
      totalReactionDmg += 0.1; //[cite: 3]
    }
  }

  // 4. Team Buffs (Extracted common buffs)[cite: 3]
  if (teamConfig.geoResonance) {
    totalGeoDMG += 0.15; //[cite: 3]
    enemyRes -= 0.2; //[cite: 3]
  }
  if (teamConfig.gorouC6) {
    totalCritDMG += 40; //[cite: 3]
    totalDEF += (NOELLE_BASE.baseDef * 0.25) + 438; //[cite: 3]
    totalGeoDMG += 0.15; //[cite: 3]
  }
  if (teamConfig.furinaC0) totalDamageBonus += 0.01 * (0.25 * 200); //[cite: 3]
  if (teamConfig.furinaC1) totalDamageBonus += 0.01 * (0.25 * 340); //[cite: 3]
  if (teamConfig.furinaC2) totalDamageBonus += 0.01 * (0.25 * 400); //[cite: 3]
  if (teamConfig.furinaC3) totalDamageBonus += 0.01 * (0.31 * 400); //[cite: 3]
  
  if (teamConfig.xianyunC0) {
    flatDamage += 4360; //[cite: 3]
    totalCritRate += 4; //[cite: 3]
  }
  if (teamConfig.columbinaC0) totalReactionDmg += 0.4; //[cite: 3]
  if (teamConfig.columbinaC2) {
    totalReactionDmg += 0.4; //[cite: 3]
    totalDEF += 400; //[cite: 3]
    elevation += 8.5; //[cite: 3]
  }
  if (teamConfig.linnea) enemyRes -= 0.35; //[cite: 3]
  // Add remaining team buffs here based on original logic...

  // 5. Final Damage Calculation[cite: 3]
  const finalDamageScalingStat = totalATK + (totalDEF * NOELLE_Q_DEF_SCALING); //[cite: 3]
  const averageCritMultiplier = 1 + (Math.min(totalCritRate / 100, 1) * (totalCritDMG / 100)); //[cite: 3]
  
  let enemyResMultiplier = 0.1; //[cite: 3]
  if (enemyRes >= 0) {
    enemyResMultiplier = 1 - enemyRes; //[cite: 3]
  } else {
    enemyResMultiplier = 1 - (enemyRes / 2); //[cite: 3]
  }

  if (weaponConfig.weaponName === "Redhorn" && attackType !== "Plunge") {
    flatDamage += totalDEF * 0.4; //[cite: 3]
  }

  // LCR Block[cite: 3]
  const hasLCR = teamConfig.columbinaC0 || teamConfig.columbinaC2 || teamConfig.linnea; //[cite: 3]
  let lcrBaseMultiplier = 0;
  if (teamConfig.columbinaC0 || teamConfig.columbinaC2) lcrBaseMultiplier += 0.07; //[cite: 3]
  if (teamConfig.linnea) lcrBaseMultiplier += 0.14; //[cite: 3]

  let totalLCRdamage = 0;
  const totalEMM = 1 + ((6 * totalEM) / (totalEM + 2000) + totalReactionDmg); //[cite: 3]

  if (hasLCR) {
    totalLCRdamage = (1446.85 * 0.96 * lcrBaseMultiplier * totalEMM * enemyResMultiplier * averageCritMultiplier * elevation); //[cite: 3]
  }

  const combinedDamageBonusMultiplier = 1 + totalGeoDMG + totalDamageBonus; //[cite: 3]
  const finalDamage = (finalDamageScalingStat * motionValue + flatDamage) * combinedDamageBonusMultiplier * averageCritMultiplier * ENEMY_DEF_MULTIPLIER * enemyResMultiplier + totalLCRdamage; //[cite: 3]

  return {
    totalATK,
    totalDEF,
    effectiveATK: finalDamageScalingStat.toFixed(2),
    totalCritRate: totalCritRate.toFixed(2) + "%",
    totalCritDMG: totalCritDMG.toFixed(2) + "%",
    totalER: (totalER * 100).toFixed(2) + "%", //[cite: 3]
    totalGeoDMG: (totalGeoDMG * 100).toFixed(2) + "%", //[cite: 3]
    totalDamageBonus: (totalDamageBonus * 100).toFixed(2) + "%", //[cite: 3]
    combinedDamageBonus: ((combinedDamageBonusMultiplier - 1) * 100).toFixed(2) + "%", //[cite: 3]
    finalDamage
  };
}