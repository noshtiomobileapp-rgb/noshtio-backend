import morgan from "morgan";

const logger = {
  info: (message: string) => {
    console.log(`INFO: ${message}`);
  },
  error: (message: string) => {
    console.error(`ERROR: ${message}`);
  },
  httpLogger: morgan("dev"),
};

export default logger;
