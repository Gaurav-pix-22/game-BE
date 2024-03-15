import { GameCode } from "../config/constant";
export interface InitInterface {
  token: string;
  gameCode: GameCode;
}

export interface DebitInterface {
  token: string;
  playerId: string;
  amount: number;
  betId: string;
  gameCode: GameCode;
  roundId?: string;
}

export interface CreditInterface {
  token: string;
  playerId: string;
  amount: number;
  betId: string;
  gameCode: GameCode;
  clientSeed: string;
  serverSeed: string;
  hashedServerSeed: string;
  nonce: number;
  payoutMultiplier: number;
  roundId?: string;
}
