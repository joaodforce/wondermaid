// Shim: gi-formula only imports these types from the GOOD format library (shapes of libs/gi/schema's parsed output)
import type {
  AscensionKey,
  CharacterKey,
  LocationCharacterKey,
  RefinementKey,
  WeaponKey,
} from '@genshin-optimizer/gi/consts'

export interface ICharacterTalent {
  auto: number
  skill: number
  burst: number
}

export interface ICharacter {
  key: CharacterKey
  level: number
  ascension: AscensionKey
  constellation: number
  talent: ICharacterTalent
}

export interface IWeapon {
  key: WeaponKey
  level: number
  ascension: AscensionKey
  refinement: RefinementKey
  location: LocationCharacterKey | ''
  lock: boolean
}
