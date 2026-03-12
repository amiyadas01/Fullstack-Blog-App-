import pino from "pino";

export const logger = pino({
  transport: {
    targets: [
      { target: "pino-pretty", options: { colorize: true }, level: "debug" }, // console
      { target: "pino/file", options: { destination: "logs/app.log" }, level: "info" }, // file
    ],
  },
});