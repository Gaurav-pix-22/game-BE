import { Joi } from "celebrate";
import { GameCode,GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.LIMBO);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const targetMultiplier = Joi.number().required();

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const limboBetSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  targetMultiplier,
}).unknown();


export {
  initSchema,
  limboBetSchema,
};
