import mongoose from "mongoose";
import { UserInterface } from "../interfaces/userInterface";

const user = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    clientSeed: {
      type: String,
      index: true,
      default: "",
    },
    serverSeed: {
      type: String,
      default: "",
    },
    hashedServerSeed: {
      type: String,
      index: true,
      default: "",
    },
    nextServerSeed: {
      type: String,
      default: "",
    },
    avtar: {
      type: String,
      default: "av1",
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
    hashedNextServerSeed: {
      type: String,
      default: "",
    },
    nonce: {
      type: Number,
      default: 0,
    },
    seedHistory: {
      type: Object,
      index: true,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model<UserInterface & mongoose.Document>("users", user);
