import { GameCode, PlinkoLevel, GameMode } from "./../config/constant";
import { PaginationInterface } from "./pagination";

export interface PlinkoStateInterface {
  risk: PlinkoLevel;
  rows: number;
  path: [string];
}

export interface PlinkoBetSessionInterface {
  token: string;
  gameCode: GameCode.PLINKO;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  risk: PlinkoLevel;
  rows: number;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface UserDBGameSessionInterface {
  _id?: string;
  token: string;
  gameCode: GameCode.PLINKO;
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
  state: PlinkoStateInterface;
  date: Date;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface InitSchemaInterface {
  gameCode: GameCode.PLINKO;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.PLINKO;
  gameMode: GameMode;
  userId: string;
  betId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
