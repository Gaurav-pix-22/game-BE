import { Joi } from "celebrate";
import { GameCode, OrderBy, GameMode } from "../config/constant";

const token = Joi.string().trim().required();
const betId = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const gameCode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameCode));
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const page = Joi.number();
const limit = Joi.number();
const orderBy = Joi.string().valid(...Object.values(OrderBy));
const platformId = Joi.string().trim().required();
const operatorId = Joi.string().trim().required();
const brandId = Joi.string().trim().required();

const allBetSchema = Joi.object({
  token,
  gameMode,
  page,
  limit,
  orderBy,
  platformId,
  operatorId,
  brandId
}).unknown();

const playerBetSchema = Joi.object({
  token,
  gameMode,
  userId,
  page,
  limit,
  orderBy,
  gameCode: Joi.string()
  .trim()
  .valid(...Object.values(GameCode))
  .allow(""),
  platformId,
  operatorId,
  brandId
}).unknown();

const betInfoSchema = Joi.object({
  gameCode,
  gameMode,
  userId,
  betId,
  platformId,
  operatorId,
  brandId
}).unknown();

const prevMultiGameInfo = Joi.object({
  gameCode,
  gameMode,
  token,
  page,
  limit,
  orderBy,
  platformId,
  operatorId,
  brandId
})

export { allBetSchema, playerBetSchema, betInfoSchema, prevMultiGameInfo };
