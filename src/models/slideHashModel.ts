import mongoose from "mongoose";
import { HashcodeInterface } from "../interfaces/common";

const slideHashcode = new mongoose.Schema(
  {
    hash: {
      type: String,
      required: true,
      index: true,
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

export default mongoose.model<HashcodeInterface & mongoose.Document>(
  "slide_hashcodes",
  slideHashcode
);
