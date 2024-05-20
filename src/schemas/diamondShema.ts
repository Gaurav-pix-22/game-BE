import { Joi } from "celebrate";
import { GameCode, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.DIAMOND);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const platformId = Joi.string().trim().required();
const operatorId = Joi.string().trim().required();
const brandId = Joi.string().trim().required();

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const diamondBetSchema = Joi.object({
  token,
  gameCode,
  gameMode,
  userId,
  currency,
  betAmount,
  platformId,
  operatorId,
  brandId
}).unknown();


export {
  initSchema,
  diamondBetSchema,
};
