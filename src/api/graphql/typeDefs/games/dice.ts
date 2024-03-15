export default `
type dicePaytable {
    outcome: Int!,
    probabilityOver: Float!,
    probabilityUnder: Float!,
    multiplierOver: Float!,
    multiplierUnder: Float!
}

type diceState {
    outcome: Float,
    condition: String!,
    target: Int,
}

type diceUserSession {
    playerId: String!,
    balance: Decimal!,
    currency: String,
    language: String,
    paytable: [dicePaytable],
    gameCode: String!,
    gameMode: String
}

type diceRollSession {
    _id: ID!,
    token: String!,
    gameCode: String,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    hashedServerSeed: String!,
    clientSeed: String!,
    serverSeed: String,
    nonce: Int,
    betId: String!,
    payout: Float,
    payoutMultiplier: Float,
    diceState: diceState,
    date: Date,
}

type diceRollResponse {
    id: ID!,
    betId: String,
    payoutMultiplier: Float,
    payout: Float,
    diceState: diceState,
    gameCode: String,
    balance: Decimal,
    date: Date,
}

type diceBetInfo {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    payout: Float,
    winChance: Float,
    multiplier: Float,
    payoutMultiplier: Float,
    clientSeed: String!,
    serverSeed: String,
    hashedServerSeed: String!,
    diceState: diceState,
    nonce: Int!,
    date: Date!,
    gameCode: String!
}
`;
