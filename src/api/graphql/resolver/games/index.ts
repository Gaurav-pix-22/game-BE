import {
  init,
  betPlace,
  cashout,
  getAllBets,
  getPlayerBetHistory,
  betInfo,
  nextMine,
  nextHilo,
  getCrashInfoById,
  getSlideInfoById,
  getMultiGameCrashHistory
} from "./game";

export default {
  Query: {
    init,
    getAllBets,
    getPlayerBetHistory,
    getMultiGameCrashHistory,
    betInfo,
    getCrashInfoById,
    getSlideInfoById
  },
  Mutation: {
    betPlace,
    nextMine,
    nextHilo,
    cashout,
  },
};
