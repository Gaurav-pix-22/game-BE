export default `
type aviatorXPlayers {
    gameId: String,
    betId: String,
    token: String,
    userId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Float,
    betAmount: Float,
    currency: String,
    gameCode: String,
    betStatus: String,
    aviatorXState: aviatorXGameState,
    date: Date,
}

type aviatorXActiveGameSession {
    id: String,
    status: String,
    round: Int,
    players: [aviatorXPlayers]
}

type aviatorXPrevRounds {
    id: String,
    multiplier: Float,
}

type aviatorXUpdateAvtar {
    ok: Boolean,
    gameCode: String
}

type aviatorXWinHistory {
    userId: String,
    gameCode: String,
    betAmount: Float,
    currency: String,
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    createdAt: Date,
    gameId: String,
    status: String,
    userAvatar: String,
    crashMultiplier: Float,
    round: Int,
}

type aviatorXGameInfo {
    crashMultiplier: Float,
    createdAt: Date,
    gameId: String,
    round: Int
}

type aviatorXWinReport {
    data: [aviatorXWinHistory],
    gameCode: String,
}

type aviatorXPreviousRound {
    data: [aviatorXBetResp],
    gameInfo: aviatorXGameInfo,
    gameCode: String,
}

type aviatorXUserSession {
    playerId: String!,
    avtar: String,
    balance: Decimal!,
    currency: String,
    language: String,
    activeGame: aviatorXActiveGameSession,
    gameCode: String!,
    gameMode: String,
    nextGameHashedSeed: String,
    clientSeed: String,
    prevRounds: [aviatorXPrevRounds],
    platformId: String,
    operatorId: String,
    brandId: String
}

type aviatorXGameState {
    cashOutAt: Decimal,
    crashedAt: Decimal
  }

type aviatorXBetResp {
    gameId: String,
    token: String,
    userId: String,
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    betAmount: Decimal,
    gameCode: String,
    aviatorXState: aviatorXGameState,
    date: Date,
    avtar: String
}

type aviatorXCashOutResp {
    ok: Boolean,
    gameCode: String
}

type aviatorXRefundResp {
    ok: Boolean,
    gameCode: String
}

type aviatorXBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    gameId: String,
    payout: Float,
    payoutMultiplier: Float,
    aviatorXState: aviatorXGameState,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    nonce: Int!,
    date: Date!,
    gameCode: String!,
    seed: String,
    hash: String,
    crashAt: Decimal
}

type ldbPlayers {
    userId: String,
    currency: String,
    betAmount: Decimal,
    betId: String,
    gameId: String,
    payout: Float,
    payoutMultiplier: Float,
    date: Date,
}

type topBetters {
    userId: String,
    userName: String,
    betId: String,
    avtar: String,
    clientSeed: String
}

type aviatorXInfoRespData {
    seed: String,
    hashSeed: String,
    hash: String,
    crashMultiplier: Decimal,
    round: Int,
    status: String,
    players: [topBetters],
    hex: String,
    decimal: Float,
    createdAt: Date
}

type aviatorXInfoResp {
    gameCode: String!,
    data: aviatorXInfoRespData
}
`;
