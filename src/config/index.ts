import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),

  /**
   * That long string from mlab
   */
  databaseURL: process.env.MONGODB_URI,

  //rgs url
  rgsUrl: process.env.RGS_URL,
  rgsSocketUrl: process.env.RGS_SOCKET_URL,
  secretKey: process.env.SECRET_KEY,
  token: process.env.TOKEN,
  payloadSecretKey: process.env.PAYLOAD_SECRET_KEY,
  signature: process.env.SIGNATURE,
  merchantId: process.env.MERCHANTID,
  metaData: process.env.META_DATA,
  base: process.env.BASE,
  allowedTimeInSec: Number(process.env.ALLOWED_TIME_IN_SEC) || 5,
  apolloKey: process.env.APOLLO_KEY,



  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },

  /**
   * API configs
   */
  api: {
    prefix: '/parimatchGame',
  },


  appName: process.env.APP_NAME,
};
