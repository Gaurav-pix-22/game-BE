import { Joi } from "celebrate";
import { DiceGameConditions, GameCode, OrderBy, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.DICE);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const target = Joi.number().required();
const condition = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(DiceGameConditions));

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const diceRollInterface = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  target,
  condition,
}).unknown();


export {
  initSchema,
  diceRollInterface,
};
