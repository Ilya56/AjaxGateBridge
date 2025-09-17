import dotenv from "dotenv";

dotenv.config();

export default {
  /**
   * Static phone with Ajax Systems + Tasker config
   */
  PHONE_HOST: process.env.PHONE_HOST,
  /**
   * Phone server port
   */
  PHONE_PORT: process.env.PHONE_PORT,
  /**
   * Path salt for security
   */
  PHONE_PATH_SALT: process.env.PHONE_PATH_SALT,
  /**
   * Api token for more security
   */
  PHONE_TOKEN: process.env.PHONE_TOKEN,
  /**
   * Api key for requests from external systems
   */
  API_KEY: process.env.API_KEY,
  /**
   * Current app port
   */
  APP_PORT: process.env.APP_PORT,
  /**
   * Timeout of the request from app to the phone tasker app
   */
  PHONE_TIMEOUT_MS: process.env.PHONE_TIMEOUT_MS,
  /**
   * Rate limit interval
   */
  MIN_INTERVAL_SEC: process.env.MIN_INTERVAL_SEC,
}
