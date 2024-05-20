export default `
type diamondState {
    result: [String]
}

type diamondPaytable {
    primaryGroup: Int!,
    secondaryGroup: Int!,
    multiplier: Float!,
    probability: Float!,
}

type diamondUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    paytable: [diamondPaytable],
    gameCode: String!,
    gameMode: String,
    platformId: String,
    operatorId: String,
    brandId: String
}

type diamondBetSession {
    betId: String,
    payout: Float,
    payoutMultiplier: Float,
    balance: Decimal,
    diamondState: diamondState,
    gameCode: String,
    date: Date,
}

type diamondBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    diamondState: diamondState,
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
