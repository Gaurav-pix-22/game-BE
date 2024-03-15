import { Document, Model } from "mongoose";
import { UserInterface } from "../../interfaces/userInterface";
import {
  UserDBGameSessionInterface as DBGameSession,
  HashcodeInterface,
  GameSeedsInterface,
} from "../../interfaces/common";
import { CrashGameInterface } from "../../interfaces/crash";
import { SlideGameInterface } from "../../interfaces/slide";

declare global {
  namespace Models {
    export type UserModel = Model<UserInterface & Document>;
    export type GameModel = Model<DBGameSession & Document>;
    export type CrashHashModel = Model<HashcodeInterface & Document>;
    export type CrashGameModel = Model<CrashGameInterface & Document>;
    export type SlideHashModel = Model<HashcodeInterface & Document>;
    export type SlideGameModel = Model<SlideGameInterface & Document>;
    export type GameSeedsModel = Model<GameSeedsInterface & Document>;
  }
}
