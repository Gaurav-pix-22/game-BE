import {
  GameCode,
  GameMode,
  MultiPlayerGameStates,
  BetStatus,
  ReportType,
  DurationType,
} from "./../config/constant";
import { PaginationInterface } from "./pagination";

export type aviatorXMultiplierByRtp = {
  1: number;
  2: number;
  3: number;
  5: number;
  7: number;
};

export interface AviatorXBetSessionInterface {
  token: string;
  gameCode: GameCode.AVIATORX;
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

export interface AviatorXPlayerStatusInterface {
  cashOutAt?: number;
  crashedAt?: number;
}

export interface AviatorXTopBettersInterface {
  userId: string;
  userName?: string;
  betId: string;
  avtar?: string;
  clientSeed: string;
}
export interface AviatorXGameInterface {
  _id?: string;
  seedId: string;
  hash: string;
  players: [AviatorXTopBettersInterface];
  crashMultiplier: aviatorXMultiplierByRtp;
  status: MultiPlayerGameStates;
  round: number;
}

export interface AviatorXGameCashoutInterface {
  token: string;
  gameId: string;
  betId: string;
  userId: string;
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface AviatorXGameCancelInterface {
  token: string;
  gameId: string;
  betId: string;
  userId: string;
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  platformId: string;
  operatorId: string;
  brandId: string;
}
export interface WSAviatorXPlayersInterface {
  gameId: string;
  betId: string;
  token: string;
  userId: string;
  payout: number;
  payoutMultiplier: number;
  balance: number;
  betAmount: number;
  currency: string;
  gameCode: GameCode.AVIATORX;
  betStatus?: BetStatus;
  gameMode: GameMode;
  crashState: AviatorXPlayerStatusInterface;
  date: Date;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface WSAviatorXGameInterface {
  id: string;
  crashMultiplier: aviatorXMultiplierByRtp;
  status: MultiPlayerGameStates;
  round: number;
  players: {
    1: [WSAviatorXPlayersInterface];
    2: [WSAviatorXPlayersInterface];
    3: [WSAviatorXPlayersInterface];
    5: [WSAviatorXPlayersInterface];
    7: [WSAviatorXPlayersInterface];
  };
}

export interface InitSchemaInterface {
  gameCode: GameCode.AVIATORX;
  token: string;
  currency?: string;
}

export interface BetInfo {
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  userId: string;
  betId: string;
}

export interface PreviousAviatorXInfo {
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  userId: string;
  gameId: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface AviatorXWinReport extends PaginationInterface {
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  userId: string;
  duration: DurationType;
  reportType: ReportType;
  token: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}

export interface AviatorXLastGameRecord {
  gameCode: GameCode.AVIATORX;
  gameMode: GameMode;
  userId: string;
  token: string;
  platformId: string;
  operatorId: string;
  brandId: string;
}
