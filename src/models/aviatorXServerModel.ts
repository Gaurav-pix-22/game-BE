import mongoose from "mongoose";
import { ServerCodeInterface } from "../interfaces/common";

const aviatorXServercode = new mongoose.Schema(
  {
    serverSeed: {
      type: String,
      index: true,
      default: "",
    },
    hashedServerSeed: {
      type: String,
      index: true,
      default: "",
    },
    isUsed: {
      type: Boolean,
      index: true,
      default: "",
    },
    order: {
      type: Number,
      default: "",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ServerCodeInterface & mongoose.Document>(
  "aviatorx_servercodes",
  aviatorXServercode
);
