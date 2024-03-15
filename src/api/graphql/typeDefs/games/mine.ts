export default `
type minePaytable {
    gem: Int!,
    probability: Float!,
    multiplier: Float!,
}

type mineUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    minePaytable: [[minePaytable]],
    activeBet: minePlaySession,
    gameCode: String!,
    gameMode: String
}

type mineRound {
    field: Int!,
    payoutMultiplier: Float!,
  }

type mineGameState {
    rounds: [mineRound]
    mineCount: Int!,
    mines: [Int]
  }

type minePlaySession {
    betId: String,
    mineState: mineGameState,
    payout: Float,
    payoutMultiplier: Float,
    betAmount: Decimal,
    balance: Decimal,
    gameCode: String,
    date: Date,
}

type mineBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    payout: Float,
    payoutMultiplier: Float,
    mineState: mineGameState,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    nonce: Int!,
    date: Date!,
    gameCode: String!
}
`;
