export default `
type crashPlayers {
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
    crashState: crashGameState,
    date: Date,
}

type activeGameSession {
    id: String,
    status: String,
    round: Int,
    players: [crashPlayers]
}

type crashUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    activeGame: activeGameSession,
    gameCode: String!,
    gameMode: String
}

type crashGameState {
    cashOutAt: Decimal,
    crashedAt: Decimal
  }

type crashBetResp {
    gameId: String,
    token: String,
    userId: String,
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    betAmount: Decimal,
    gameCode: String,
    crashState: crashGameState,
    date: Date,
}

type crashCashOutResp {
    ok: Boolean,
    gameCode: String
}

type crashBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    gameId: String,
    payout: Float,
    payoutMultiplier: Float,
    crashState: crashGameState,
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

type crashInfoResp {
    leaderboard: [ldbPlayers]
    gameCode: String!,
    seed: String,
    hash: String,
    crashAt: Decimal,
    round: Int,
    date: Date
}
`;
