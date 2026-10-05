import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

export function readConfig(): Config {
  const filePath = getConfigFilePath();

  const fileContents = fs.readFileSync(filePath, {
    encoding: "utf-8",
  });

  const rawConfig = JSON.parse(fileContents);

  return validateConfig(rawConfig);
}

export function setUser(username: string): void {
  const cfg = readConfig();

  cfg.currentUserName = username;

  writeConfig(cfg);
}

function writeConfig(cfg: Config): void {
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  const filePath = getConfigFilePath();

  fs.writeFileSync(
    filePath,
    JSON.stringify(rawConfig, null, 2),
    {
      encoding: "utf-8",
    },
  );
}

function validateConfig(rawConfig: any): Config {
  if (
    typeof rawConfig !== "object" ||
    rawConfig === null ||
    typeof rawConfig.db_url !== "string"
  ) {
    throw new Error("Invalid config file");
  }

  if (
    rawConfig.current_user_name !== undefined &&
    typeof rawConfig.current_user_name !== "string"
  ) {
    throw new Error("Invalid current_user_name");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}