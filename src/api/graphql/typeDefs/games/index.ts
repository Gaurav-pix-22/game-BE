export default `
type err {
    message: String!,
    isError: Boolean
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

union initResponse = diceUserSession | mineUserSession | hiloUserSession | limboUserSession | diamondUserSession | plinkoUserSession | crashUserSession | slideUserSession | aviatorXUserSession | err
union betPlaceResponse = diceRollResponse | minePlaySession | hiloPlaySession | limboBetSession | diamondBetSession | plinkoBetSession | crashBetResp | slideBetResp | aviatorXBetResp | err
union cashOutResponse = minePlaySession | hiloPlaySession | crashCashOutResp | aviatorXCashOutResp | err
union refundResponse = aviatorXRefundResp | err
union winReportResponse = aviatorXWinReport | err
union previousSessionResponse = aviatorXPreviousRound | err
union updateUserProfileResponse = aviatorXUpdateAvtar | err
union getAllBetsResponse = betHistoryResponse | err
union getPlayerBetHistory = betHistoryResponse | err
union getBetInfo = mineBetInfo | diceBetInfo | hiloBetInfo | limboBetInfo | diamondBetInfo | plinkoBetInfo | crashBetInfo | slideBetInfo | aviatorXBetInfo | err
union multiGameHistoryResp = prevCrashGames | err
union crashInfoByIdResp = crashInfoResp | aviatorXInfoResp | err

type Query {
    init(token: String!, currency: String!, gameCode: String!): initResponse
    getAllBets(token: String!, page: Int, limit: Int, orderBy: String, gameMode: String!, platformId: String!, operatorId: String!, brandId: String!): getAllBetsResponse
    getPlayerBetHistory(token: String!, userId: String!, page: Int, limit: Int, orderBy: String, gameMode: String!, gameCode: String, platformId: String!, operatorId: String!, brandId: String!): getPlayerBetHistory
    betInfo(gameCode: String!, userId: String!, betId: String!, gameMode: String!, platformId: String!, operatorId: String!, brandId: String!): getBetInfo
    getCrashInfoById(gameCode: String!, userId: String!, gameId: String!, gameMode: String!, platformId: String!, operatorId: String!, brandId: String!): crashInfoByIdResp
    getSlideInfoById(gameCode: String!, userId: String!, gameId: String!, gameMode: String!, platformId: String!, operatorId: String!, brandId: String!): slideInfoResp
    getMultiGameCrashHistory(token: String!, page: Int, limit: Int, orderBy: String, gameMode: String!, gameCode: String!, platformId: String!, operatorId: String!, brandId: String!): multiGameHistoryResp
    getWinReport(token: String!, page: Int, limit: Int, orderBy: String, gameMode: String!, gameCode: String!, userId: String!, duration: String, reportType: String, platformId: String!, operatorId: String!, brandId: String!): winReportResponse
    previousRound(token: String!, userId: String!, gameCode: String!, gameMode: String!, platformId: String!, operatorId: String!, brandId: String!): previousSessionResponse
} 

type Mutation {
    betPlace(token: String!, platformId: String!, operatorId: String!, brandId: String!, currency: String!, gameCode: String!, gameMode: String!, userId: String!, betAmount: Decimal!, target: Int, condition: String, mineCount: Int, betNumber: Int, variable: [Int], playMode: String, card: cardInp, targetMultiplier: Decimal, risk: String, rows: Int, cashOutAt: Decimal, gameId: String): betPlaceResponse
    cashout(token: String!, platformId: String!, operatorId: String!, brandId: String!, gameCode: String!, userId: String!, betId: String!, gameMode: String!, gameId: String): cashOutResponse
    refund(token: String!, platformId: String!, operatorId: String!, brandId: String!, gameCode: String!, userId: String!, betId: String!, gameMode: String!, gameId: String): refundResponse
    nextMine(token: String!, platformId: String!, operatorId: String!, brandId: String!, gameCode: String!, userId: String!, variable: [Int], betId: String!): minePlaySession
    nextHilo(token: String!, platformId: String!, operatorId: String!, brandId: String!, gameCode: String!, userId: String!, betId: String!, guess: String!): hiloPlaySession
    updateUserProfile(token: String!, platformId: String!, operatorId: String!, brandId: String!, userId: String!, avtar: String, gameCode: String!): updateUserProfileResponse
    
}

scalar Date
scalar Decimal
`;
