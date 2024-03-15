import { Joi } from "celebrate";
import { PlinkoLevel, GameCode, GameMode } from "../config/constant";

const serverSeed = Joi.string().trim().default("");
const clientSeed = Joi.string().trim().default("");
const hash = Joi.string().trim().default("");
const seed = Joi.string().trim().default("");
const nonce = Joi.number().required();
const mineCount = Joi.number().min(1).required();
const rows = Joi.number().min(8).max(16).required();
const risk = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(PlinkoLevel));
const gameMode = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(GameMode));

const mineSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  mineCount,
  gameCode: Joi.string().trim().required().valid(GameCode.MINE),
}).unknown();

const diceSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  gameCode: Joi.string().trim().required().valid(GameCode.DICE),
}).unknown();

const limboSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  gameCode: Joi.string().trim().required().valid(GameCode.LIMBO),
}).unknown();

const hiloSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  gameCode: Joi.string().trim().required().valid(GameCode.HILO),
}).unknown();

const diamondSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  gameCode: Joi.string().trim().required().valid(GameCode.DIAMOND),
}).unknown();

const plinkoSchema = Joi.object({
  serverSeed,
  clientSeed,
  nonce,
  rows,
  risk,
  gameCode: Joi.string().trim().required().valid(GameCode.PLINKO),
  gameMode
}).unknown();

const crashSchema = Joi.object({
  hash,
  seed,
  gameCode: Joi.string().trim().required().valid(GameCode.CRASH),
  gameMode
}).unknown();

const slideSchema = Joi.object({
  hash,
  seed,
  gameCode: Joi.string().trim().required().valid(GameCode.SLIDE),
  gameMode
}).unknown();

export {
  mineSchema,
  diceSchema,
  limboSchema,
  hiloSchema,
  diamondSchema,
  plinkoSchema,
  crashSchema,
  slideSchema
};
