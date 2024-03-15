export default `
type plinkoState {
    risk: String,
    rows: Int,
    path: [String]
}

type plinkoPaytable {
    multiplier: Float!,
    probability: Float!,
}

type plinkoLevelInfo {
    row: Int!,
    multiplierMap: [plinkoPaytable],
}

type plinkoLevels {
    low: [plinkoLevelInfo],
    medium: [plinkoLevelInfo],
    high: [plinkoLevelInfo],
}

type plinkoUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    gameCode: String!,
    paytableByLevels: plinkoLevels,
    gameMode: String
}

type plinkoBetSession {
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    balanceBefore: Decimal,
    plinkoState: plinkoState,
    gameCode: String,
    date: Date,
}

type plinkoBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    plinkoState: plinkoState,
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
