import { Joi } from "celebrate";
import {
  DurationType,
  GameCode,
  GameMode,
  ReportType,
  OrderBy,
} from "../config/constant";

const token = Joi.string().trim().required();
const gameCode = Joi.string().trim().required().valid(GameCode.AVIATORX);
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));
const currency = Joi.string().trim().required();
const userId = Joi.string().trim().required();
const betId = Joi.string().trim().required();
const gameId = Joi.string().trim().required();
const betAmount = Joi.number().required();
const cashOutAt = Joi.number().allow(null);
const page = Joi.number();
const limit = Joi.number();
const orderBy = Joi.string().valid(...Object.values(OrderBy));
const platformId = Joi.string().trim().required();
const operatorId = Joi.string().trim().required();
const brandId = Joi.string().trim().required();

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

const refundSchema = Joi.object({
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
});

const updateAvtar = Joi.object({
  userId,
  token,
  gameCode,
  avtar: Joi.string().trim().required(),
  platformId,
  operatorId,
  brandId
});

const winReport = Joi.object({
  gameCode,
  gameMode,
  userId,
  token,
  duration: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(DurationType)),
  reportType: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(ReportType)),
  page,
  limit,
  orderBy,
  platformId,
  operatorId,
  brandId
});

const previousRoundInfo = Joi.object({
  gameCode,
  gameMode,
  userId,
  token,
  platformId,
  operatorId,
  brandId
});

const roundInfoById = Joi.object({
  gameCode,
  gameMode,
  userId,
  gameId,
  platformId,
  operatorId,
  brandId
})

export {
  initSchema,
  betSessionSchema,
  previousRoundInfo,
  cashoutSchema,
  prevCrashInfo,
  refundSchema,
  updateAvtar,
  winReport,
  roundInfoById
};
