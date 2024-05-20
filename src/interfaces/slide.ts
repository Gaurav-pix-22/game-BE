import {
  GameCode,
  GameMode,
  MultiPlayerGameStates,
  BetStatus,
} from "./../config/constant";

export type multiplierByRtp = {
  1: number;
  2: number;
  3: number;
  5: number;
  7: number;
};

export interface SlideGameInterface {
  _id?: string;
  hashId: string;
  seedId: string;
  multiplier: multiplierByRtp;
  numbers: [number],
  status: MultiPlayerGameStates;
  round: number;
}

export interface SlideBetSessionInterface {
  token: string;
  gameCode: GameCode.SLIDE;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  targetMultiplier: number;
  gameId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface SlidePlayerStatusInterface {
  targetMultiplier?: number;
  multiplier?: number;
}

export interface SlideGameCashoutInterface {
  token: string;
  gameId: string;
  betId: string;
  userId: string;
  gameCode: GameCode.SLIDE;
  gameMode: GameMode;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface WSSlidePlayersInterface {
  gameId: string;
  betId: string;
  token: string;
  userId: string;
  payout: number;
  payoutMultiplier: number;
  balance: number;
  betAmount: number;
  currency: string;
  gameCode: GameCode.SLIDE;
  betStatus?: BetStatus;
  gameMode: GameMode;
  slideState: SlidePlayerStatusInterface;
  date: Date;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface WSSlideGameInterface {
  id: string;
  multiplier: multiplierByRtp;
  numbers: [number],
  status: MultiPlayerGameStates;
  round: number;
  players: {
    1: [WSSlidePlayersInterface];
    2: [WSSlidePlayersInterface];
    3: [WSSlidePlayersInterface];
    5: [WSSlidePlayersInterface];
    7: [WSSlidePlayersInterface];
  };
}

export interface InitSchemaInterface {
  gameCode: GameCode.SLIDE;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.SLIDE;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface PreviousSlideInfo {
  gameCode: GameCode.SLIDE;
  gameMode: GameMode;
  userId: string;
  gameId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
