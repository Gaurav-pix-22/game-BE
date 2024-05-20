export default `
type slidePlayers {
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
    slideState: slideGameState,
    date: Date,
}

type slideActiveGameSession {
    id: String,
    status: String,
    numbers: [Float],
    multiplier: Float,
    gameEndIn: Int,
    round: Int,
    players: [slidePlayers]
}

type slideUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    activeGame: slideActiveGameSession,
    gameCode: String!,
    gameMode: String,
    platformId: String,
    operatorId: String,
    brandId: String
}

type slideGameState {
    targetMultiplier: Decimal,
    multiplier: Decimal
  }

type slideBetResp {
    gameId: String,
    token: String,
    userId: String,
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    betAmount: Decimal,
    gameCode: String,
    slideState: slideGameState,
    date: Date,
}

type slideBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    gameId: String,
    payout: Float,
    payoutMultiplier: Float,
    slideState: slideGameState,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    nonce: Int!,
    date: Date!,
    gameCode: String!,
    seed: String,
    hash: String,
    multiplier: Float
}

type slideLDBPlayers {
    userId: String,
    currency: String,
    betAmount: Decimal,
    betId: String,
    gameId: String,
    payout: Float,
    payoutMultiplier: Float,
    date: Date,
}

type slideInfoResp {
    leaderboard: [slideLDBPlayers]
    gameCode: String!,
    seed: String,
    hash: String,
    multiplier: Decimal,
    round: Int,
    date: Date
}
`;
