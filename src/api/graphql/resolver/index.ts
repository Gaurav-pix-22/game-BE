import userResolver from "./user";
import games from "./games";
import decimal from "../scaler/decimal";
import { GameCode } from "../../../config/constant";

const resolvers = {
  fairnessResp: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.DICE:
        case GameCode.LIMBO:
          return "diceAndLimboFairness";
        case GameCode.MINE:
          return "mineFairness";
        case GameCode.HILO:
          return "hiloFairness";
        case GameCode.DIAMOND:
          return "diamondFairness";
        case GameCode.PLINKO:
          return "plinkoFairness";
        case GameCode.CRASH:
          return "crashFairness";
        case GameCode.SLIDE:
          return "slideFairness";
        default:
          return "err";
      }
    },
  },
  initResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.DICE:
          return "diceUserSession";
        case GameCode.MINE:
          return "mineUserSession";
        case GameCode.HILO:
          return "hiloUserSession";
        case GameCode.LIMBO:
          return "limboUserSession";
        case GameCode.DIAMOND:
          return "diamondUserSession";
        case GameCode.PLINKO:
          return "plinkoUserSession";
        case GameCode.CRASH:
          return "crashUserSession";
        case GameCode.AVIATORX:
          return "aviatorXUserSession";
        case GameCode.SLIDE:
          return "slideUserSession";
        default:
          return "err";
      }
    },
  },
  betPlaceResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.DICE:
          return "diceRollResponse";
        case GameCode.MINE:
          return "minePlaySession";
        case GameCode.HILO:
          return "hiloPlaySession";
        case GameCode.LIMBO:
          return "limboBetSession";
        case GameCode.DIAMOND:
          return "diamondBetSession";
        case GameCode.PLINKO:
          return "plinkoBetSession";
        case GameCode.CRASH:
          return "crashBetResp";
        case GameCode.AVIATORX:
          return "aviatorXBetResp";
        case GameCode.SLIDE:
          return "slideBetResp";
        default:
          return "err";
      }
    },
  },
  cashOutResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.MINE:
          return "minePlaySession";
        case GameCode.HILO:
          return "hiloPlaySession";
        case GameCode.CRASH:
          return "crashCashOutResp";
        case GameCode.AVIATORX:
          return "aviatorXCashOutResp";
        default:
          return "err";
      }
    },
  },
  refundResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.AVIATORX:
          return "aviatorXRefundResp";
        default:
          return "err";
      }
    },
  },
  updateUserProfileResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.AVIATORX:
          return "aviatorXUpdateAvtar";
        default:
          return "err";
      }
    },
  },
  winReportResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.AVIATORX:
          return "aviatorXWinReport";
        default:
          return "err";
      }
    },
  },
  previousSessionResponse: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.AVIATORX:
          return "aviatorXPreviousRound";
        default:
          return "err";
      }
    },
  },
  getPlayerBetHistory: {
    __resolveType(obj, contextValue, info) {
      return "betHistoryResponse";
    },
  },
  getAllBetsResponse: {
    __resolveType(obj, contextValue, info) {
      return "betHistoryResponse";
    },
  },
  multiGameHistoryResp: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.SLIDE:
        case GameCode.CRASH:
          return "prevCrashGames";
        default:
          return "err";
      }
    },
  },
  crashInfoByIdResp: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.CRASH:
          return "crashInfoResp";
        case GameCode.AVIATORX:
          return "aviatorXInfoResp";
        default:
          return "err";
      }
    },
  },
  getBetInfo: {
    __resolveType(obj, contextValue, info) {
      switch (obj?.gameCode) {
        case GameCode.DICE:
          return "diceBetInfo";
        case GameCode.MINE:
          return "mineBetInfo";
        case GameCode.HILO:
          return "hiloBetInfo";
        case GameCode.LIMBO:
          return "limboBetInfo";
        case GameCode.DIAMOND:
          return "diamondBetInfo";
        case GameCode.PLINKO:
          return "plinkoBetInfo";
        case GameCode.CRASH:
          return "crashBetInfo";
        case GameCode.AVIATORX:
          return "aviatorXBetInfo";
        case GameCode.SLIDE:
          return "slideBetInfo";
        default:
          return "err";
      }
    },
  },
  Query: {
    ...games.Query,
    ...userResolver.Query,
  },
  Mutation: {
    ...games.Mutation,
    ...userResolver.Mutation,
  },
  Decimal: decimal,
};

export default resolvers;
