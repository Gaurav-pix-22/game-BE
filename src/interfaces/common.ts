import { LimboGameStateInterface } from "./limbo";
import { DiceStateInterface } from "./dice";
import { MinegameState } from "./mine";
import { PlinkoStateInterface } from "./plinko";
import { DiamondStateInterface } from "./diamond";
import { gameState as HiloStateInterface } from "./hilo";
import {CrashPlayerStatusInterface} from "./crash";
import {SlidePlayerStatusInterface} from "./slide";
import { GameCode, GameMode, BetStatus } from "./../config/constant";
import { PaginationInterface } from "./pagination";

export interface UserDBGameSessionInterface {
  _id?: string;
  token: string;
  gameCode: GameCode;
  gameMode: GameMode;
  userId: string;
  currency: string;
  betAmount: number;
  hashedServerSeed: string;
  clientSeed: string;
  serverSeed: string;
  nonce: number;
  active: boolean;
  betId: string;
  payout: number;
  outcome: number;
  payoutMultiplier: number;
  state: GameStates[UserDBGameSessionInterface["gameCode"]];
  gameId?: string;
  betStatus?: BetStatus;
  err?: string;
  date: Date;
}

export interface GameStates {
  [GameCode.DICE]: DiceStateInterface;
  [GameCode.LIMBO]: LimboGameStateInterface;
  [GameCode.DIAMOND]: DiamondStateInterface;
  [GameCode.CRASH]: CrashPlayerStatusInterface;
  [GameCode.SLIDE]: SlidePlayerStatusInterface;
  [GameCode.HILO]: HiloStateInterface;
  [GameCode.MINE]: MinegameState;
  [GameCode.PLINKO]: PlinkoStateInterface;
}

export interface AllBetsInterface extends PaginationInterface {
  token: string;
  gameMode: GameMode;
}

export interface PlayerBetsInterface extends PaginationInterface {
  userId: string;
  gameMode: GameMode;
  token: string;
}

export interface PrevGameInfo extends PaginationInterface {
  gameMode: GameMode;
  gameCode: GameCode;
  token: string;
}

export interface HashcodeInterface {
  _id?: string;
  hash: string;
  isUsed: boolean;
  order: number;
}

export interface GameSeedsInterface {
  _id?: string;
  seed: string;
  bitcoin_blocknumber: number;
  proof: string;
  gameCode: GameCode;
}
