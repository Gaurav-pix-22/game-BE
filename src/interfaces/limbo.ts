import { GameCode, GameMode } from "./../config/constant";
import { PaginationInterface } from "./pagination";

export interface LimboGameStateInterface {
  targetMultiplier: number;
  outcome: number;
}

export interface LimboBetSessionInterface {
  token: string;
  gameCode: GameCode.LIMBO;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  targetMultiplier: number;
}

export interface InitSchemaInterface {
  gameCode: GameCode.LIMBO;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.LIMBO;
  gameMode: GameMode;
  userId: string;
  betId: string;
}
