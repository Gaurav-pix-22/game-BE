import { Joi } from "celebrate";
import { GameCode, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.SLIDE);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const gameId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const targetMultiplier = Joi.number().required();


const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const betSessionSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  gameId,
  targetMultiplier
}).unknown();

const prevSlideInfo = Joi.object({
  gameCode,
  gameMode,
  userId,
  gameId
})

export { initSchema, betSessionSchema, prevSlideInfo };
