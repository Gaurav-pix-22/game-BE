import mongoose from "mongoose";
import { SlideGameInterface } from "../interfaces/slide";
import { MultiPlayerGameStates } from "../config/constant";

const slideGame = new mongoose.Schema(
  {
    hashId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "slide_hashcodes",
    },
    seedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "game_seeds",
    },
    multiplier: {
      type: Object,
      index: true,
    },
    numbers: {
      type: [Number],
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

export default mongoose.model<SlideGameInterface & mongoose.Document>(
  "slide_games",
  slideGame
);
