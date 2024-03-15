import { Joi } from "celebrate";
import { GameCode, PlinkoLevel, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.PLINKO);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const rows = Joi.number().min(8).max(16).required();
const risk = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(PlinkoLevel));

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const plinkoBetSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  risk,
  rows
}).unknown();


export {
  initSchema,
  plinkoBetSchema,
};
