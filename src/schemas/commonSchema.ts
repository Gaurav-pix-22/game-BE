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

const allBetSchema = Joi.object({
  token,
  gameMode,
  page,
  limit,
  orderBy,
}).unknown();

const playerBetSchema = Joi.object({
  token,
  gameMode,
  userId,
  page,
  limit,
  orderBy,
}).unknown();

const betInfoSchema = Joi.object({
  gameCode,
  gameMode,
  userId,
  betId,
}).unknown();

const prevMultiGameInfo = Joi.object({
  gameCode,
  gameMode,
  token,
  page,
  limit,
  orderBy,
})

export { allBetSchema, playerBetSchema, betInfoSchema, prevMultiGameInfo };
