import mongoose from 'mongoose';
import config from '../config';

export default async (): Promise<mongoose.Connection> => {
  mongoose.set('strictQuery', false);
  const connection = await mongoose.connect(config.databaseURL);
  return connection.connection;
};
