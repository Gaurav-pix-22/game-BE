import Container from "typedi";
import userService from "../../../../services/userService";
import {
  mineSchema,
  diceSchema,
  limboSchema,
  hiloSchema,
  diamondSchema,
  plinkoSchema,
  crashSchema,
  slideSchema,
} from "../../../../schemas/fairnessSchema";
import { GameCode } from "../../../../config/constant";

const validateUser = async (parent, { token }) => {
  const userServiceInstance = Container.get(userService);
  const resp = await userServiceInstance.validateUserSession({
    token,
  });

  return resp;
};

const generateHash = async (parent, { initialHash, gameCode }) => {
  const userServiceInstance = Container.get(userService);
  // await userServiceInstance.generateHashCodes(initialHash, gameCode);

  return { added: true };
};

const createNewUser = async (parent, { token, userId, clientSeed }) => {
  const userServiceInstance = Container.get(userService);
  const resp = await userServiceInstance.createNewUser({
    token,
    userId,
    clientSeed,
  });

  return resp;
};

const updateClientSeed = async (parent, { token, userId, clientSeed }) => {
  const userServiceInstance = Container.get(userService);
  const resp = await userServiceInstance.updateClientSeed({
    token,
    userId,
    clientSeed,
  });

  return resp;
};

const getUserSeeds = async (parent, { token, userId }) => {
  const userServiceInstance = Container.get(userService);
  const resp = await userServiceInstance.getUserSeeds({ token, userId });

  return resp;
};

const getServerSeed = async (parent, { hashedServerSeed }) => {
  const userServiceInstance = Container.get(userService);
  const resp = await userServiceInstance.getServerSeed({
    hashedServerSeed,
  });

  return resp;
};

const verifyFairness = async (parent, args) => {
  const userServiceInstance = Container.get(userService);

  switch (args?.gameCode) {
    case GameCode.DICE:
      await diceSchema.validateAsync(args);
      break;
    case GameCode.LIMBO:
      await limboSchema.validateAsync(args);
      break;
    case GameCode.MINE:
      await mineSchema.validateAsync(args);
      break;
    case GameCode.HILO:
      await hiloSchema.validateAsync(args);
      break;
    case GameCode.DIAMOND:
      await diamondSchema.validateAsync(args);
      break;
    case GameCode.PLINKO:
      await plinkoSchema.validateAsync(args);
      break;
    case GameCode.CRASH:
      await crashSchema.validateAsync(args);
      break;
    case GameCode.SLIDE:
      await slideSchema.validateAsync(args);
      break;
    default:
      return { message: "Invalid game code." };
  }

  const resp = await userServiceInstance.verifyFairness(args);
  return resp;
};

export {
  createNewUser,
  updateClientSeed,
  getUserSeeds,
  getServerSeed,
  verifyFairness,
  validateUser,
  generateHash
};
