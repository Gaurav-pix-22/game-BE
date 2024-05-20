import {
  GameCode,
  GameMode,
  MultiPlayerGameStates,
  BetStatus,
} from "./../config/constant";

export type crashMultiplierByRtp = {
  1: number;
  2: number;
  3: number;
  5: number;
  7: number;
};

export interface CrashBetSessionInterface {
  token: string;
  gameCode: GameCode.CRASH;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  cashOutAt: number;
  gameId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface CrashPlayerStatusInterface {
  cashOutAt?: number;
  crashedAt?: number;
}
export interface CrashGameInterface {
  _id?: string;
  hashId: string;
  seedId: string;
  crashMultiplier: crashMultiplierByRtp;
  status: MultiPlayerGameStates;
  round: number;
}

export interface CrashGameCashoutInterface {
  token: string;
  gameId: string;
  betId: string;
  userId: string;
  gameCode: GameCode.CRASH;
  gameMode: GameMode;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface WSCrashPlayersInterface {
  gameId: string;
  betId: string;
  token: string;
  userId: string;
  payout: number;
  payoutMultiplier: number;
  balance: number;
  betAmount: number;
  currency: string;
  gameCode: GameCode.CRASH;
  betStatus?: BetStatus;
  gameMode: GameMode;
  crashState: CrashPlayerStatusInterface;
  date: Date;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface WSCrashGameInterface {
  id: string;
  crashMultiplier: crashMultiplierByRtp;
  status: MultiPlayerGameStates;
  round: number;
  players: {
    1: [WSCrashPlayersInterface];
    2: [WSCrashPlayersInterface];
    3: [WSCrashPlayersInterface];
    5: [WSCrashPlayersInterface];
    7: [WSCrashPlayersInterface];
  };
}

export interface InitSchemaInterface {
  gameCode: GameCode.CRASH;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.CRASH;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface PreviousCrashInfo {
  gameCode: GameCode.CRASH;
  gameMode: GameMode;
  userId: string;
  gameId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
