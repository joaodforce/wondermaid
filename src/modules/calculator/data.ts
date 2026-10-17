// Game data shared by the Enka mapper, the calculator and the UI. IDs match Enka's store
// (https://github.com/EnkaNetwork/API-docs/tree/master/store/gi).

export const NOELLE_CHARACTER_ID = 10000034;

export const WEAPON_IDS = {
  whiteblind: 12407,
  serpentSpine: 12409,
  redhornStonethresher: 12510,
} as const;

export const WEAPON_NAMES: Record<number, string> = {
  12401: 'Favonius Greatsword',
  12402: 'The Bell',
  12403: 'Sacrificial Greatsword',
  12404: 'Royal Greatsword',
  12405: 'Rainslasher',
  12406: 'Prototype Archaic',
  12407: 'Whiteblind',
  12408: 'Blackcliff Slasher',
  12409: 'Serpent Spine',
  12410: 'Lithic Blade',
  12411: 'Snow-Tombed Starsilver',
  12412: 'Luxurious Sea-Lord',
  12414: 'Katsuragikiri Nagamasa',
  12415: 'Makhaira Aquamarine',
  12416: 'Akuoumaru',
  12417: 'Forest Regalia',
  12418: 'Mailed Flower',
  12424: 'Talking Stick',
  12425: 'Tidal Shadow',
  12426: "Ultimate Overlord's Mega Magic Sword",
  12427: 'Portable Power Saw',
  12430: 'Fruitful Hook',
  12431: 'Earth Shaker',
  12432: 'Flame-Forged Insight',
  12433: 'Master Key',
  12435: 'Forged by the Golden Melody',
  12436: 'Blade of Atonement',
  12501: 'Skyward Pride',
  12502: "Wolf's Gravestone",
  12503: 'Song of Broken Pines',
  12504: 'The Unforged',
  12505: 'Primordial Jade Greatsword',
  12510: 'Redhorn Stonethresher',
  12511: 'Beacon of the Reed Sea',
  12512: 'Verdict',
  12513: 'Fang of the Mountain King',
  12514: 'A Thousand Blazing Suns',
  12515: 'Gest of the Mighty Wolf',
  12516: 'A Teaspoon of Transcendence',
};

export const ARTIFACT_SET_IDS = {
  gladiatorsFinale: 15001,
  archaicPetra: 15014,
  huskOfOpulentDreams: 15021,
  marechausseeHunter: 15031,
  nighttimeWhispers: 15034,
  nightOfTheSkysUnveiling: 15041,
} as const;

export const ARTIFACT_SET_NAMES: Record<number, string> = {
  10003: "Defender's Will",
  15001: "Gladiator's Finale",
  15014: 'Archaic Petra',
  15015: 'Retracing Bolide',
  15017: 'Tenacity of the Millelith',
  15020: 'Emblem of Severed Fate',
  15021: 'Husk of Opulent Dreams',
  15031: 'Marechaussee Hunter',
  15032: 'Golden Troupe',
  15034: 'Nighttime Whispers in the Echoing Woods',
  15037: 'Scroll of the Hero of Cinder City',
  15038: 'Obsidian Codex',
  15039: "Long Night's Oath",
  15041: "Night of the Sky's Unveiling",
  15042: "Silken Moon's Serenade",
  15043: 'Aubade of Morningstar and Moon',
};

export const weaponName = (id: number) => WEAPON_NAMES[id] ?? `Weapon #${id}`;
export const artifactSetName = (id: number) => ARTIFACT_SET_NAMES[id] ?? `Set #${id}`;

/** Icons are served by Enka (https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md#icons-and-images) */
export const enkaIconUrl = (icon: string) => `https://enka.network/ui/${icon}.png`;

// From Enka's store/gi/avatars.json entry for Noelle
export const NOELLE_TALENTS = {
  normal: { name: 'Favonius Bladework - Maid', skillId: 10341, proudGroupId: 3431, icon: 'Skill_A_04' },
  skill: { name: 'Breastplate', skillId: 10342, proudGroupId: 3432, icon: 'Skill_S_Noel_01' },
  burst: { name: 'Sweeping Time', skillId: 10343, proudGroupId: 3439, icon: 'Skill_E_Noel_01' },
} as const;

export const NOELLE_CONSTELLATIONS = [
  { name: 'I Got Your Back', icon: 'UI_Talent_S_Noel_01' },
  { name: 'Combat Maid', icon: 'UI_Talent_S_Noel_02' },
  { name: 'Invulnerable Maid', icon: 'UI_Talent_U_Noel_01' },
  { name: 'To Be Cleaned', icon: 'UI_Talent_S_Noel_03' },
  { name: 'Favonius Sweeper Master', icon: 'UI_Talent_U_Noel_02' },
  { name: 'Must Be Spotless', icon: 'UI_Talent_S_Noel_04' },
] as const;

export const NOELLE_SIDE_ICON = 'UI_AvatarIcon_Side_Noel';

/** Labels for Enka's FIGHT_PROP_* stat names; `percent` stats are shown with a % sign */
export const STAT_LABELS: Record<string, { label: string; percent: boolean }> = {
  FIGHT_PROP_HP: { label: 'HP', percent: false },
  FIGHT_PROP_ATTACK: { label: 'ATK', percent: false },
  FIGHT_PROP_DEFENSE: { label: 'DEF', percent: false },
  FIGHT_PROP_HP_PERCENT: { label: 'HP', percent: true },
  FIGHT_PROP_ATTACK_PERCENT: { label: 'ATK', percent: true },
  FIGHT_PROP_DEFENSE_PERCENT: { label: 'DEF', percent: true },
  FIGHT_PROP_CRITICAL: { label: 'CRIT Rate', percent: true },
  FIGHT_PROP_CRITICAL_HURT: { label: 'CRIT DMG', percent: true },
  FIGHT_PROP_CHARGE_EFFICIENCY: { label: 'Energy Recharge', percent: true },
  FIGHT_PROP_HEAL_ADD: { label: 'Healing Bonus', percent: true },
  FIGHT_PROP_ELEMENT_MASTERY: { label: 'Elemental Mastery', percent: false },
  FIGHT_PROP_PHYSICAL_ADD_HURT: { label: 'Physical DMG Bonus', percent: true },
  FIGHT_PROP_FIRE_ADD_HURT: { label: 'Pyro DMG Bonus', percent: true },
  FIGHT_PROP_ELEC_ADD_HURT: { label: 'Electro DMG Bonus', percent: true },
  FIGHT_PROP_WATER_ADD_HURT: { label: 'Hydro DMG Bonus', percent: true },
  FIGHT_PROP_WIND_ADD_HURT: { label: 'Anemo DMG Bonus', percent: true },
  FIGHT_PROP_ICE_ADD_HURT: { label: 'Cryo DMG Bonus', percent: true },
  FIGHT_PROP_ROCK_ADD_HURT: { label: 'Geo DMG Bonus', percent: true },
  FIGHT_PROP_GRASS_ADD_HURT: { label: 'Dendro DMG Bonus', percent: true },
};
