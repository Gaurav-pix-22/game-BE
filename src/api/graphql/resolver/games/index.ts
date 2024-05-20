import {
  init,
  betPlace,
  cashout,
  refund,
  getAllBets,
  getPlayerBetHistory,
  betInfo,
  nextMine,
  nextHilo,
  getCrashInfoById,
  getSlideInfoById,
  getMultiGameCrashHistory,
  updateUserProfile,
  getWinReport,
  previousRound
} from "./game";

export default {
  Query: {
    init,
    getAllBets,
    getPlayerBetHistory,
    getMultiGameCrashHistory,
    betInfo,
    getCrashInfoById,
    getSlideInfoById,
    getWinReport,
    previousRound
  },
  Mutation: {
    betPlace,
    nextMine,
    nextHilo,
    cashout,
    refund,
    updateUserProfile
  },
};
