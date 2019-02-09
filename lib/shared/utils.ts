import { promisify } from "util";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs";
const kleur = require("kleur");

export const readFile = promisify(fsReadFile);
export const writeFile = promisify(fsWriteFile);

export const localURL = "http://mafreebox.freebox.fr";

export const log = {
  warn: (message: string) => {
    console.warn(kleur.yellow(message));
  },
  info: (message: string) => {
    console.info(kleur.cyan(message));
  },
  success: (message: string) => {
    console.log(kleur.green(message));
  }
};
