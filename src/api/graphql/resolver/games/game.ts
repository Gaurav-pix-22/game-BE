import Container from "typedi";
import {
  allBetSchema,
  playerBetSchema,
  betInfoSchema,
  prevMultiGameInfo,
} from "../../../../schemas/commonSchema";
import { initSchema, diceRollInterface } from "../../../../schemas/diceSchema";
import {
  initSchema as mineInitSchema,
  betSessionSchema,
  nextMineSchema,
  cashoutSchema,
} from "../../../../schemas/mineSchema";
import {
  initSchema as hiloInitSchema,
  betSessionSchema as hiloBetSchema,
  nextHiloSchema,
  cashoutSchema as hiloCashoutSchema,
} from "../../../../schemas/hiloSchema";
import {
  initSchema as limboInitSchema,
  limboBetSchema,
} from "../../../../schemas/limboSchema";
import {
  initSchema as diamondInitSchema,
  diamondBetSchema,
} from "../../../../schemas/diamondShema";
import {
  initSchema as plinkoInitSchema,
  plinkoBetSchema,
} from "../../../../schemas/plinkoSchema";
import {
  initSchema as crashInitSchema,
  betSessionSchema as crashBetSchema,
  cashoutSchema as crashCashoutSchema,
  prevCrashInfo,
} from "../../../../schemas/crashSchema";
import {
  initSchema as aviatorXInitSchema,
  betSessionSchema as aviatorXBetSchema,
  cashoutSchema as aviatorXCashoutSchema,
  prevCrashInfo as prevAviatorXInfo,
  refundSchema,
  updateAvtar,
  winReport,
  previousRoundInfo,
  roundInfoById,
} from "../../../../schemas/aviatorXSchema";
import {
  initSchema as slideInitSchema,
  betSessionSchema as slideBetSchema,
  prevSlideInfo,
} from "../../../../schemas/slideSchema";
import { GameCode } from "../../../../config/constant";
import mineService from "../../../../services/mineService";
import diceService from "../../../../services/diceService";
import hiloService from "../../../../services/hiloService";
import limboService from "../../../../services/limboService";
import diamondService from "../../../../services/diamondService";
import plinkoService from "../../../../services/plinkoService";
import crashService from "../../../../services/crashService";
import aviatorXService from "../../../../services/aviatorXService";
import slideService from "../../../../services/slideService";
import generalGameService from "../../../../services/generalGameService";

const init = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const diceServiceInstance = Container.get(diceService);
  const hiloServiceInstance = Container.get(hiloService);
  const limboServiceInstance = Container.get(limboService);
  const diamondServiceInstance = Container.get(diamondService);
  const plinkoServiceInstance = Container.get(plinkoService);
  const crashServiceInstance = Container.get(crashService);
  const aviatorXServiceInstance = Container.get(aviatorXService);
  const slideServiceInstance = Container.get(slideService);

  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.DICE:
        await initSchema.validateAsync(args);
        resp = await diceServiceInstance.getUserSession(args);
        break;
      case GameCode.MINE:
        await mineInitSchema.validateAsync(args);
        resp = await mineServiceInstance.getUserSession(args);
        break;
      case GameCode.HILO:
        await hiloInitSchema.validateAsync(args);
        resp = await hiloServiceInstance.getUserSession(args);
        break;
      case GameCode.LIMBO:
        await limboInitSchema.validateAsync(args);
        resp = await limboServiceInstance.getUserSession(args);
        break;
      case GameCode.DIAMOND:
        await diamondInitSchema.validateAsync(args);
        resp = await diamondServiceInstance.getUserSession(args);
        break;
      case GameCode.PLINKO:
        await plinkoInitSchema.validateAsync(args);
        resp = await plinkoServiceInstance.getUserSession(args);
        break;
      case GameCode.CRASH:
        await crashInitSchema.validateAsync(args);
        resp = await crashServiceInstance.getUserSession(args);
        break;
      case GameCode.AVIATORX:
        await aviatorXInitSchema.validateAsync(args);
        resp = await aviatorXServiceInstance.getUserSession(args);
        break;
      case GameCode.SLIDE:
        await slideInitSchema.validateAsync(args);
        resp = await slideServiceInstance.getUserSession(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const betPlace = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const diceServiceInstance = Container.get(diceService);
  const hiloServiceInstance = Container.get(hiloService);
  const limboServiceInstance = Container.get(limboService);
  const diamondServiceInstance = Container.get(diamondService);
  const plinkoServiceInstance = Container.get(plinkoService);
  const crashServiceInstance = Container.get(crashService);
  const aviatorXServiceInstance = Container.get(aviatorXService);
  const slideServiceInstance = Container.get(slideService);

  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.DICE:
        await diceRollInterface.validateAsync(args);
        resp = await diceServiceInstance.diceRoll(args);
        break;
      case GameCode.MINE:
        await betSessionSchema.validateAsync(args);
        resp = await mineServiceInstance.betPlace(args);
        break;
      case GameCode.HILO:
        await hiloBetSchema.validateAsync(args);
        resp = await hiloServiceInstance.betPlace(args);
        break;
      case GameCode.LIMBO:
        await limboBetSchema.validateAsync(args);
        resp = await limboServiceInstance.limboBet(args);
        break;
      case GameCode.DIAMOND:
        await diamondBetSchema.validateAsync(args);
        resp = await diamondServiceInstance.diamondBet(args);
        break;
      case GameCode.PLINKO:
        await plinkoBetSchema.validateAsync(args);
        resp = await plinkoServiceInstance.plinkoBet(args);
        break;
      case GameCode.CRASH:
        await crashBetSchema.validateAsync(args);
        resp = await crashServiceInstance.betPlace(args);
        break;
      case GameCode.AVIATORX:
        console.log(args);
        await aviatorXBetSchema.validateAsync(args);
        resp = await aviatorXServiceInstance.betPlace(args);
        break;
      case GameCode.SLIDE:
        await slideBetSchema.validateAsync(args);
        resp = await slideServiceInstance.betPlace(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const cashout = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const hiloServiceInstance = Container.get(hiloService);
  const crashServiceInstance = Container.get(crashService);
  const aviatorXServiceInstance = Container.get(aviatorXService);

  let resp;
  try {
    switch (args?.gameCode) {
      case GameCode.MINE:
        await cashoutSchema.validateAsync(args);
        resp = await mineServiceInstance.cashOut(args);
        break;
      case GameCode.HILO:
        await hiloCashoutSchema.validateAsync(args);
        resp = await hiloServiceInstance.cashOut(args);
        break;
      case GameCode.CRASH:
        await crashCashoutSchema.validateAsync(args);
        resp = await crashServiceInstance.cashOut(args);
        break;
      case GameCode.AVIATORX:
        await aviatorXCashoutSchema.validateAsync(args);
        resp = await aviatorXServiceInstance.cashOut(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const refund = async (parent, args) => {
  const aviatorXServiceInstance = Container.get(aviatorXService);

  let resp;
  try {
    switch (args?.gameCode) {
      case GameCode.AVIATORX:
        await refundSchema.validateAsync(args);
        resp = await aviatorXServiceInstance.cancelBet(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const getWinReport = async (parent, args) => {
  const aviatorXServiceInstance = Container.get(aviatorXService);

  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.AVIATORX:
        await winReport.validateAsync(args);
        resp = await aviatorXServiceInstance.getWinReport(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const previousRound = async (parent, args) => {
  const aviatorXServiceInstance = Container.get(aviatorXService);

  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.AVIATORX:
        await previousRoundInfo.validateAsync(args);
        resp = await aviatorXServiceInstance.getLastGameRecord(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const updateUserProfile = async (parent, args) => {
  const aviatorXServiceInstance = Container.get(aviatorXService);

  let resp;

  switch (args?.gameCode) {
    case GameCode.AVIATORX:
      await updateAvtar.validateAsync(args);
      resp = await aviatorXServiceInstance.updateUserAvtar(args);
      break;
    default:
      return { message: "Invalid game code." };
  }

  return resp;
};

const getAllBets = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);

  let resp;

  try {
    await allBetSchema.validateAsync(args);
    resp = await gameServiceInstance.getAllBets(args);
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const getPlayerBetHistory = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);
  let resp;

  try {
    await playerBetSchema.validateAsync(args);
    resp = await gameServiceInstance.getPlayerBetHistory(args);
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const getMultiGameCrashHistory = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);
  let resp;

  try {
    await prevMultiGameInfo.validateAsync(args);
    resp = await gameServiceInstance.getPreviousGameInfo(args);
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const betInfo = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const diceServiceInstance = Container.get(diceService);
  const hiloServiceInstance = Container.get(hiloService);
  const limboServiceInstance = Container.get(limboService);
  const diamondServiceInstance = Container.get(diamondService);
  const plinkoServiceInstance = Container.get(plinkoService);
  const crashServiceInstance = Container.get(crashService);
  const aviatorXServiceInstance = Container.get(aviatorXService);
  const slideServiceInstance = Container.get(slideService);

  await betInfoSchema.validateAsync(args);
  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.DICE:
        resp = await diceServiceInstance.getBetInfo(args);
        break;
      case GameCode.MINE:
        resp = await mineServiceInstance.getBetInfo(args);
        break;
      case GameCode.HILO:
        resp = await hiloServiceInstance.getBetInfo(args);
        break;
      case GameCode.LIMBO:
        resp = await limboServiceInstance.getBetInfo(args);
        break;
      case GameCode.DIAMOND:
        resp = await diamondServiceInstance.getBetInfo(args);
        break;
      case GameCode.PLINKO:
        resp = await plinkoServiceInstance.getBetInfo(args);
        break;
      case GameCode.CRASH:
        resp = await crashServiceInstance.getBetInfo(args);
        break;
      case GameCode.AVIATORX:
        resp = await aviatorXServiceInstance.getBetInfo(args);
        break;
      case GameCode.SLIDE:
        resp = await slideServiceInstance.getBetInfo(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const nextMine = async (parent, args) => {
  await nextMineSchema.validateAsync(args);
  const mineServiceInstance = Container.get(mineService);
  const resp = await mineServiceInstance.updatePlaysession(args);

  return resp;
};

const nextHilo = async (parent, args) => {
  await nextHiloSchema.validateAsync(args);
  const hiloServiceInstance = Container.get(hiloService);
  const resp = await hiloServiceInstance.updatePlaysession(args);

  return resp;
};

const getCrashInfoById = async (parent, args) => {
  const crashServiceInstance = Container.get(crashService);
  const aviatorXServiceInstance = Container.get(aviatorXService);
  let resp;

  try {
    switch (args?.gameCode) {
      case GameCode.CRASH:
        await prevCrashInfo.validateAsync(args);
        resp = await crashServiceInstance.getCrashGameInfoById(args);
        break;
      case GameCode.AVIATORX:
        await roundInfoById.validateAsync(args);
        resp = await aviatorXServiceInstance.getCrashGameInfoById(args);
        break;
      default:
        return { message: "Invalid game code." };
    }
  } catch (e) {
    resp = {
      message: e?.response?.data?.detailedMsg || e?.response?.data?.message || e?.message || "",
      isError: true,
    };
  }

  return resp;
};

const getSlideInfoById = async (parent, args) => {
  await prevSlideInfo.validateAsync(args);
  const slideServiceInstance = Container.get(slideService);
  const resp = await slideServiceInstance.getSlideGameInfoById(args);

  return resp;
};

export {
  init,
  betPlace,
  cashout,
  refund,
  getAllBets,
  getPlayerBetHistory,
  getMultiGameCrashHistory,
  nextMine,
  nextHilo,
  betInfo,
  getCrashInfoById,
  getSlideInfoById,
  updateUserProfile,
  getWinReport,
  previousRound,
};
