export default `
type hiloPaytable {
    rank: String!,
    probHigh: Float!,
    probLow: Float!,
    multiplierHigh: Float!,
    multiplierLow: Float!,
    probability: Float!
}

input cardInp {
    suit: String!,
    rank: String!
}

type card {
    suit: String!,
    rank: String!
}

type hiloPlayRounds {
    card: card,
    guess: String,
    payoutMultiplier: Float!,
}

type hiloGameState {
    startCard: card,
    rounds: [hiloPlayRounds]
}

type hiloUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    gameCode: String!,
    paytable: [hiloPaytable],
    activeBet: hiloPlaySession,
    gameMode: String,
    platformId: String,
    operatorId: String,
    brandId: String
}

type hiloPlaySession {
    betId: String,
    hiloState: hiloGameState,
    payout: Float,
    payoutMultiplier: Float,
    betAmount: Decimal,
    balance: Decimal,
    gameCode: String,
    active: Boolean,
    date: Date,
}

type hiloBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    payout: Float,
    payoutMultiplier: Float,
    hiloState: hiloGameState,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    nonce: Int!,
    date: Date!,
    gameCode: String!
}
`