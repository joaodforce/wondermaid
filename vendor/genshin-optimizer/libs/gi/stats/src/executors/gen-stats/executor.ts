// Shim: the real executor builds allStat_gen.json from the datamine pipeline. The engine only imports its
// types: CharacterDataGen and WeaponDataGen are copied from gen-stats/src, the rest is inferred from the JSON.
import type {
  ElementKey,
  LocationCharacterKey,
  MainStatKey,
  RegionKey,
  WeaponKey,
  WeaponTypeKey,
} from '@genshin-optimizer/gi/consts'
import type { StatKey } from '@genshin-optimizer/gi/dm'
import type allStatGen from '../../allStat_gen.json'

type CharacterGrowCurveKey = keyof AllStatJson['char']['expCurve']
type WeaponGrowCurveKey = keyof AllStatJson['weapon']['expCurve']

export type CharacterDataGen = {
  key: LocationCharacterKey
  ele?: ElementKey | undefined
  region?: RegionKey | undefined
  weaponType: WeaponTypeKey
  lvlCurves: {
    key: 'hp' | 'atk' | 'def'
    base: number
    curve: CharacterGrowCurveKey
  }[]
  baseStats?: Partial<Record<MainStatKey, number>>
  rarity: 1 | 2 | 3 | 4 | 5
  ascensionBonus: { [key in StatKey]?: number[] }
  birthday: {
    month?: number
    day?: number
  }
}

type WeaponProp = {
  type?: StatKey
  base: number
  curve: WeaponGrowCurveKey
}

export type WeaponDataGen = {
  weaponType: WeaponTypeKey
  rarity: 1 | 2 | 3 | 4 | 5
  mainStat: WeaponProp
  subStat?: WeaponProp | undefined
  lvlCurves: { key?: StatKey; base: number; curve: WeaponGrowCurveKey }[]
  refinementBonus: { [key in StatKey]?: number[] }
  ascensionBonus: { [key in StatKey]?: number[] }
}

type AllStatJson = typeof allStatGen

export type AllStats = Omit<AllStatJson, 'char' | 'weapon'> & {
  char: Omit<AllStatJson['char'], 'data'> & { data: Record<LocationCharacterKey, CharacterDataGen> }
  weapon: Omit<AllStatJson['weapon'], 'data'> & { data: Record<WeaponKey, WeaponDataGen> }
}
