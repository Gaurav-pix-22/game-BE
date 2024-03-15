export enum DeviceType {
  IOS = "ios",
  ANDROID = "android",
}

export enum GameType {
  FREE_PLAY = "free_play",
  CASH_PLAY = "cash_play",
}

export enum OrderBy {
  ASC = "asc",
  DESC = "desc",
}

export enum GameCode {
  DICE = "DICE",
  LIMBO = "LIMBO",
  MINE = "MINES",
  HILO = "HILO",
  PLINKO = "PLINKO",
  CRASH = "CRASH",
  SLIDE = "SLIDE",
  DIAMOND = "DIAMONDS",
}

export enum GameMode {
  ONE = "1",
  TWO = "2",
  THREE = "3",
  FIVE = "5",
  SEVEN = "7",
}

export enum CardSuit {
  CLUBS = "C",
  DIAMONDS = "D",
  HEARTS = "H",
  SPADES = "S",
}

export enum CardRank {
  ACE = "A",
  TWO = "2",
  THREE = "3",
  FOUR = "4",
  FIVE = "5",
  SIX = "6",
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
  TEN = "10",
  JACK = "J",
  QUEEN = "Q",
  KING = "K",
}

export enum DiceGameConditions {
  above = "ABOVE",
  below = "BELOW",
}

export enum HiloGameConditions {
  lowerEqual = "LOWER_EQUAL",
  higherEqual = "HIGHER_EQUAL",
  high = "HIGH",
  low = "LOW",
  same = "SAME",
  skip = "SKIP",
}

export enum PlinkoLevel {
  low = "LOW",
  medium = "MEDIUM",
  high = "HIGH",
}

export enum PlayMode {
  bet = "bet",
  auto = "auto",
}

export enum MultiPlayerGameStates {
  scheduled = "SCHEDULED",
  starting = "STARTING",
  acceptBet = "ACCEPT_BET",
  running = "RUNNING",
  halt = "HALT",
  ended = "ENDED",
  result = "RESULT"
}

export enum BetStatus {
  debitSuccess = "DEBIT_SUCCESS",
  creditSuccess = "CREDIT_SUCCESS",
  creditUnderProcess = "CREDIT_UNDER_PROCESS",
  creditFailed = "CREDIT_FAILED",
}
 
export enum SocketEvents {
  cashout = "CASH_OUT",
  cashedout = "CASHED_OUT",
  unsuccessFullCashout = "UNSUCCESSFULL_CASHOUT", //event for player who lost since he didn't cashout
  playersBetStatus = "PLAYER_BET_STATUS",
  betPlaced = "BET_PLACED",
  balance = "BALANCE",
  balanceDebit = "BALANCE_DEBIT",
  balanceCredited = "BALANCE_CREDITED",
  joinRoom = "JOIN_ROOM",
  leaveRoom = "LEAVE_ROOM"
}
