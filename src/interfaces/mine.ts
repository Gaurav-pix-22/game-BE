import { GameCode, PlayMode, GameMode } from "./../config/constant";
import { PaginationInterface } from "./pagination";

export type round = {
  field: number;
  payoutMultiplier: number;
};

export type MinegameState = {
  rounds: [round];
  mineCount: number;
  mines: [number];
};

export interface NextMineInterface {
  token: string;
  gameCode: GameCode.MINE;
  userId: string;
  variable: [number];
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface BetSessionInterface {
  token: string;
  gameCode: GameCode.MINE;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  mineCount: number;
  variable?: [number];
  playMode: PlayMode;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface CashoutInterface {
  token: string;
  gameCode: GameCode.MINE;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface InitSchemaInterface {
  gameCode: GameCode.MINE;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.MINE;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
