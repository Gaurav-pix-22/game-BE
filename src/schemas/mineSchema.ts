import { Joi } from "celebrate";
import { GameCode, PlayMode, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.MINE);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const mineCount = Joi.number().required();
const playMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(PlayMode));

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const nextMineSchema = Joi.object({
  token,
  gameCode,
  userId,
  variable: Joi.array()
    .min(1)
    .max(1)
    .items(Joi.number().min(0).max(24))
    .required(),
  betId,
}).unknown();

const cashoutSchema = Joi.object({
  token,
  gameMode,
  gameCode,
  userId,
  betId,
}).unknown();

const betSessionSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  mineCount,
  playMode,
  variable: Joi.alternatives().conditional("playMode", {
    is: PlayMode.auto,
    then: Joi.array().min(1).items(Joi.number().min(0).max(24)).required(),
    otherwise: Joi.forbidden(),
  }),
}).unknown();

export { initSchema, betSessionSchema, nextMineSchema, cashoutSchema };
