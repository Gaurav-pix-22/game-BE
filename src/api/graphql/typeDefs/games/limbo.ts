export default `
type limboState {
    outcome: Decimal,
    targetMultiplier: Decimal
}

type limboUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    gameCode: String!,
    gameMode: String
}

type limboBetSession {
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    limboState: limboState,
    gameCode: String,
    date: Date,
}

type limboBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    limboState: limboState,
    winChance: Float,
    payout: Float,
    payoutMultiplier: Float,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    nonce: Int!,
    date: Date!,
    gameCode: String!
}
`;
