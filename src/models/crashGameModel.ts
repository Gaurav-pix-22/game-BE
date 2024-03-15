import mongoose from "mongoose";
import { CrashGameInterface } from "../interfaces/crash";
import { MultiPlayerGameStates } from "../config/constant";

const crashGame = new mongoose.Schema(
  {
    hashId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "crash_hashcodes",
    },
    seedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "game_seeds",
    },
    crashMultiplier: {
      type: Object,
      index: true,
    },
    status: {
      type: String,
      index: true,
      enum: MultiPlayerGameStates,
    },
    round: {
      type: Number,
      require: true
    },
  },
  { timestamps: true }
);

export default mongoose.model<CrashGameInterface & mongoose.Document>(
  "crash_games",
  crashGame
);
