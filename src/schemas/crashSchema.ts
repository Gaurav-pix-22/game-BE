import { Joi } from "celebrate";
import { GameCode, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.CRASH);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betId = Joi.string().trim().required();
const gameId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const cashOutAt = Joi.number().required();
const platformId = Joi.string().trim().required();
const operatorId = Joi.string().trim().required();
const brandId = Joi.string().trim().required();
// const betNumber = Joi.number().required();


const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const cashoutSchema = Joi.object({
  token,
  gameMode,
  gameCode,
  gameId,
  userId,
  betId,
  platformId,
  operatorId,
  brandId
}).unknown();

const betSessionSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  gameId,
  cashOutAt,
  platformId,
  operatorId,
  brandId
}).unknown();

const prevCrashInfo = Joi.object({
  gameCode,
  gameMode,
  userId,
  gameId,
  platformId,
  operatorId,
  brandId
})

export { initSchema, betSessionSchema,  cashoutSchema, prevCrashInfo };
