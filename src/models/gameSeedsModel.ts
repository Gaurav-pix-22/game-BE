import mongoose from "mongoose";
import { GameSeedsInterface } from "../interfaces/common";
import { GameCode } from "../config/constant";

const gameSeeds = new mongoose.Schema(
  {
    seed: {
      type: String,
      required: true,
      index: true,
    },
    bitcoin_blocknumber: {
      type: Number,
      default: 0,
    },
    proof: {
      type: String,
      default: "",
    },
    game_code: {
      type: String,
      enum: GameCode,
      default: "",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<GameSeedsInterface & mongoose.Document>(
  "game_seeds",
  gameSeeds
);
