import { Joi } from "celebrate";
import {
  GameCode,
  GameMode,
  OrderBy,
  HiloGameConditions,
  CardRank,
  CardSuit,
} from "../config/constant";

const platformId = Joi.string().trim().required();
const operatorId = Joi.string().trim().required();
const brandId = Joi.string().trim().required();
const token = Joi.string().trim().required();
const betId = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.HILO);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const guess = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(HiloGameConditions));
const card = Joi.object({
  suit: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(CardSuit)),
  rank: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(CardRank)),
}).required();
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betAmount = Joi.number().required();

const initSchema = Joi.object({
  token,
  gameCode,
  currency,
}).unknown();

const betSessionSchema = Joi.object({
  token,
  gameMode,
  gameCode,
  userId,
  currency,
  betAmount,
  card,
  platformId,
  operatorId,
  brandId
}).unknown();

const nextHiloSchema = Joi.object({
  token,
  gameCode,
  userId,
  betId,
  guess,
  platformId,
  operatorId,
  brandId
}).unknown();

const cashoutSchema = Joi.object({
  token,
  gameMode,
  gameCode,
  userId,
  betId,
  platformId,
  operatorId,
  brandId
}).unknown();

export {
  initSchema,
  betSessionSchema,
  nextHiloSchema,
  cashoutSchema,
};
