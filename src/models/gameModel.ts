import mongoose from "mongoose";
import { UserDBGameSessionInterface } from "../interfaces/common";
import { GameCode, GameMode, BetStatus } from "../config/constant";

const game = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      ref: "users",
    },
    clientSeed: {
      type: String,
      required: true,
      index: true,
    },
    serverSeed: {
      type: String,
      required: true,
      index: true,
    },
    hashedServerSeed: {
      type: String,
      required: true,
      index: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    gameCode: {
      type: String,
      enum: GameCode,
      required: true,
      index: true,
    },
    gameMode: {
      type: String,
      enum: GameMode,
      required: true,
      index: true,
    },
    platformId: {
      type: String,
      default: "",
      index: true,
    },
    operatorId: {
      type: String,
      default: "",
      index: true,
    },
    brandId: {
      type: String,
      default: "",
      index: true,
    },
    currency: {
      type: String,
      required: true,
      index: true,
    },
    betAmount: {
      type: Number,
      required: true,
    },
    payout: {
      type: Number,
      required: true,
    },
    payoutMultiplier: {
      type: Number,
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    betStatus: {
      type: String,
      default: "",
      enum: BetStatus,
      index: true
    },
    avtar: {
      type: String,
      default: ""
    },
    err: {
      type: String,
      default: ""
    },
    active: {
      type: Boolean,
      required: true,
      index: true,
    },
    betId: {
      type: String,
      required: true,
    },
    state: {
      type: Object,
      default: {},
    },
    date: {
      type: Date,
      require: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<UserDBGameSessionInterface & mongoose.Document>(
  "game_user_sessions",
  game
);
