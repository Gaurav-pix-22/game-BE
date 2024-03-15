export default `
type err {
    message: String!
}

type historyData {
    _id: ID!,
    userId: String!,
    currency: String!,
    betAmount: Decimal!,
    betId: String!,
    payout: Float,
    payoutMultiplier: Float,
    date: Date,
    gameCode: String!
}

type betHistoryResponse {
    data: [historyData],
    totalCount: Int,
}

type multiPlayerGameHistory {
    gameId: String,
    status: String,
    round: Int,
    multiplier: Float,
    date: Date,
}

type prevCrashGames {
    games: [multiPlayerGameHistory],
    totalCount: Int,
    gameCode: String
}

union initResponse = diceUserSession | mineUserSession | hiloUserSession | limboUserSession | diamondUserSession | plinkoUserSession | crashUserSession | slideUserSession | err
union betPlaceResponse = diceRollResponse | minePlaySession | hiloPlaySession | limboBetSession | diamondBetSession | plinkoBetSession | crashBetResp | slideBetResp | err
union cashOutResponse = minePlaySession | hiloPlaySession | crashCashOutResp | err
union getAllBetsResponse = betHistoryResponse | err
union getPlayerBetHistory = betHistoryResponse | err
union getBetInfo = mineBetInfo | diceBetInfo | hiloBetInfo | limboBetInfo | diamondBetInfo | plinkoBetInfo | crashBetInfo | slideBetInfo | err
union multiGameHistoryResp = prevCrashGames | err

type Query {
    init(token: String!, currency: String!, gameCode: String!): initResponse
    getAllBets(token: String!, page: Int, limit: Int, orderBy: String, gameMode: String!): getAllBetsResponse
    getPlayerBetHistory(token: String!, userId: String!, page: Int, limit: Int, orderBy: String, gameMode: String!): getPlayerBetHistory
    betInfo(gameCode: String!, userId: String!, betId: String!, gameMode: String!): getBetInfo
    getCrashInfoById(gameCode: String!, userId: String!, gameId: String!, gameMode: String!): crashInfoResp
    getSlideInfoById(gameCode: String!, userId: String!, gameId: String!, gameMode: String!): slideInfoResp
    getMultiGameCrashHistory(token: String!, page: Int, limit: Int, orderBy: String, gameMode: String!, gameCode: String!): multiGameHistoryResp
} 

type Mutation {
    betPlace(token: String!, currency: String!, gameCode: String!, gameMode: String!, userId: String!, betAmount: Decimal!, target: Int, condition: String, mineCount: Int, betNumber: Int, variable: [Int], playMode: String, card: cardInp, targetMultiplier: Decimal, risk: String, rows: Int, cashOutAt: Decimal, gameId: String): betPlaceResponse
    cashout(token: String!, gameCode: String!, userId: String!, betId: String!, gameMode: String!, gameId: String): cashOutResponse
    nextMine(token: String!, gameCode: String!, userId: String!, variable: [Int], betId: String!): minePlaySession
    nextHilo(token: String!, gameCode: String!, userId: String!, betId: String!, guess: String!): hiloPlaySession
}

scalar Date
scalar Decimal
`;
