import mongoose from "mongoose";
import { AviatorXGameInterface } from "../interfaces/aviatorx";
import { MultiPlayerGameStates } from "../config/constant";

const aviatorXGame = new mongoose.Schema(
  {
    seedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "aviatorx_servercodes",
    },
    hash: {
      type: String,
      require: true,
      index: true,
      default: ""
    },
    players: {
      type: Array,
      require: true,
      default: [],
    },
    crashMultiplier: {
      type: Object,
      require: true,
      index: true,
    },
    status: {
      type: String,
      index: true,
      enum: MultiPlayerGameStates,
    },
    round: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<AviatorXGameInterface & mongoose.Document>(
  "aviatorx_games",
  aviatorXGame
);
