import {
  createNewUser,
  updateClientSeed,
  getUserSeeds,
  getServerSeed,
  verifyFairness,
  validateUser,
  generateHash
} from "./user";

export default {
  Query: {
    getUserSeeds,
    getServerSeed,
  },
  Mutation: {
    createNewUser,
    updateClientSeed,
    verifyFairness,
    validateUser,
    generateHash
  },
};
