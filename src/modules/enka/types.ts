// Subset of the Enka.Network showcase response we read
// (https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md)

export interface EnkaResponse {
  uid?: string;
  /** Seconds until Enka refreshes this UID's showcase */
  ttl?: number;
  playerInfo?: {
    nickname?: string;
    level?: number;
    profilePicture?: { avatarId?: number; id?: number };
  };
  /** Missing when the player hides character details */
  avatarInfoList?: EnkaAvatar[];
}

export interface EnkaAvatar {
  avatarId: number;
  /** Unlocked constellation IDs; absent at C0 */
  talentIdList?: number[];
  propMap?: Record<string, { type: number; val?: string }>;
  fightPropMap?: Record<string, number>;
  skillLevelMap?: Record<string, number>;
  equipList?: EnkaEquip[];
}

export interface EnkaStat {
  mainPropId?: string;
  appendPropId?: string;
  statValue: number;
}

export interface EnkaEquip {
  itemId: number;
  weapon?: { level: number; promoteLevel?: number; affixMap?: Record<string, number> };
  reliquary?: { level: number; mainPropId: number; appendPropIdList?: number[] };
  flat: {
    itemType: 'ITEM_WEAPON' | 'ITEM_RELIQUARY';
    icon: string;
    rankLevel?: number;
    equipType?: string;
    reliquaryMainstat?: EnkaStat;
    reliquarySubstats?: EnkaStat[];
    weaponStats?: EnkaStat[];
  };
}

export type EnkaErrorCode =
  | 'INVALID_UID'
  | 'PLAYER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE'
  | 'SHOWCASE_HIDDEN'
  | 'NOELLE_NOT_FOUND';

export class EnkaError extends Error {
  constructor(
    public readonly code: EnkaErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'EnkaError';
  }
}
