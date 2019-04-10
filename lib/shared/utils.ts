import { promisify } from "util";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs";

export const readFile = promisify(fsReadFile);
export const writeFile = promisify(fsWriteFile);

export const localURL = "http://mafreebox.freebox.fr";

const logColorReset = "%s\x1b[0m";

export const log = {
  warn: (message: string) => {
    console.warn(`\x1b[33m${logColorReset}`, message);
  },
  info: (message: string) => {
    console.info(`\x1b[36m${logColorReset}`, message);
  },
  success: (message: string) => {
    console.log(`\x1b[32m${logColorReset}`, message);
  },
  error: (message: string) => {
    console.error(`\x1b[31m${logColorReset}`, message);
  }
};
