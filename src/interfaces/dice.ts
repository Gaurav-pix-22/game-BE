import { DiceGameConditions, GameCode, GameMode } from "./../config/constant";

export interface DiceRollSessionInterface {
  token: string;
  gameCode: GameCode.DICE;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  target: number;
  condition: DiceGameConditions;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface DiceStateInterface {
  outcome: number;
  condition: DiceGameConditions;
  target: number;
}

export interface BetInfo {
  gameCode: GameCode.DICE;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface InitSchemaInterface {
  gameCode: GameCode.DICE;
  token: string;
  currency?: string
}
