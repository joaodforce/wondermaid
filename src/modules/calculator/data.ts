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
