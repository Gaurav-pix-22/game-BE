import Container from "typedi";
import {
  allBetSchema,
  playerBetSchema,
  betInfoSchema,
  prevMultiGameInfo
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
  prevCrashInfo
} from "../../../../schemas/crashSchema";
import {
  initSchema as slideInitSchema,
  betSessionSchema as slideBetSchema,
  prevSlideInfo
} from "../../../../schemas/slideSchema";
import { GameCode } from "../../../../config/constant";
import mineService from "../../../../services/mineService";
import diceService from "../../../../services/diceService";
import hiloService from "../../../../services/hiloService";
import limboService from "../../../../services/limboService";
import diamondService from "../../../../services/diamondService";
import plinkoService from "../../../../services/plinkoService";
import crashService from "../../../../services/crashService";
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
  const slideServiceInstance = Container.get(slideService);

  let resp;

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
    case GameCode.SLIDE:
      await slideInitSchema.validateAsync(args);
      resp = await slideServiceInstance.getUserSession(args);
      break;
    default:
      return { message: "Invalid game code." };
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
  const slideServiceInstance = Container.get(slideService);

  let resp;

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
    case GameCode.SLIDE:
      await slideBetSchema.validateAsync(args);
      resp = await slideServiceInstance.betPlace(args);
      break;
    default:
      return { message: "Invalid game code." };
  }

  return resp;
};

const cashout = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const hiloServiceInstance = Container.get(hiloService);
  const crashServiceInstance = Container.get(crashService);

  let resp;

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
    default:
      return { message: "Invalid game code." };
  }

  return resp;
};

const getAllBets = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);

  await allBetSchema.validateAsync(args);
  let resp = await gameServiceInstance.getAllBets(args);

  return resp;
};

const getPlayerBetHistory = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);

  await playerBetSchema.validateAsync(args);
  let resp = await gameServiceInstance.getPlayerBetHistory(args);

  return resp;
};

const getMultiGameCrashHistory = async (parent, args) => {
  const gameServiceInstance = Container.get(generalGameService);

  await prevMultiGameInfo.validateAsync(args);
  let resp = await gameServiceInstance.getPreviousGameInfo(args);

  return resp;
}

const betInfo = async (parent, args) => {
  const mineServiceInstance = Container.get(mineService);
  const diceServiceInstance = Container.get(diceService);
  const hiloServiceInstance = Container.get(hiloService);
  const limboServiceInstance = Container.get(limboService);
  const diamondServiceInstance = Container.get(diamondService);
  const plinkoServiceInstance = Container.get(plinkoService);
  const crashServiceInstance = Container.get(crashService);
  const slideServiceInstance = Container.get(slideService);

  await betInfoSchema.validateAsync(args);
  let resp;

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
    case GameCode.SLIDE:
      resp = await slideServiceInstance.getBetInfo(args);
      break;
    default:
      return { message: "Invalid game code." };
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
  await prevCrashInfo.validateAsync(args);
  const crashServiceInstance = Container.get(crashService);
  const resp = await crashServiceInstance.getCrashGameInfoById(args);

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
  getAllBets,
  getPlayerBetHistory,
  getMultiGameCrashHistory,
  nextMine,
  nextHilo,
  betInfo,
  getCrashInfoById,
  getSlideInfoById
};
