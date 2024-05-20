import {
  GameCode,
  HiloGameConditions,
  CardSuit,
  CardRank,
  GameMode
} from "./../config/constant";

export type card = {
  suit: CardSuit;
  rank: CardRank;
};

export type outcome = {
  index: number;
  card: string;
  rankValue: number
}

export type round = {
  card: card;
  guess: HiloGameConditions;
  payoutMultiplier: number;
};

export type gameState = {
  rounds: [round];
  startCard: card;
  outcome: outcome;
};

export interface NextCardInterface {
  token: string;
  gameCode: GameCode.HILO;
  userId: string;
  guess: HiloGameConditions;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface BetSessionInterface {
  token: string;
  gameCode: GameCode.HILO;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  card: card;
  platformId: string;
  operatorId: string;
  brandId: string;
}
export interface CashoutInterface {
  token: string;
  gameCode: GameCode.HILO;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface InitSchemaInterface {
  gameCode: GameCode.HILO;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.HILO;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}