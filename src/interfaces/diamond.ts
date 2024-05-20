import { GameCode, GameMode } from "./../config/constant";
import { PaginationInterface } from "./pagination";

export interface DiamondStateInterface {
  result: [string];
}

export interface DiamondBetSessionInterface {
  token: string;
  gameCode: GameCode.DIAMOND;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface UserDBGameSessionInterface {
  _id?: string;
  token: string;
  gameCode: GameCode.DIAMOND;
  userId: string;
  currency: string;
  betAmount: number;
  hashedServerSeed: string;
  clientSeed: string;
  serverSeed: string;
  nonce: number;
  betId: string;
  payout: number;
  payoutMultiplier: number;
  state: DiamondStateInterface;
  date: Date;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface InitSchemaInterface {
  gameCode: GameCode.DIAMOND;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.DIAMOND;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
