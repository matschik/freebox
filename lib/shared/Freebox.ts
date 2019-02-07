import { Agent as HttpsAgent } from "https";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import appRoot = require("app-root-path");

import {
  stringifyFreeboxConnection,
  log,
  readFile,
  writeFile,
  localURL
} from "./utils";
import freeboxRootCA from "./https/freeboxRootCA";
import {
  openSession,
  getChallenge,
  requestAuthorization,
  trackAuthorizationProgress,
  SessionStart,
  Response,
  Session
} from "../apis/Login";
import { discovery, DiscoveryResponse } from "../apis/Discovery";

interface App {
  app_id: string;
  app_name: string;
  app_version?: string;
  device_name: string;
  app_token?: string;
}

export interface Connection {
  api_domain: string;
  https_port: number;
}

interface FreeboxConfig {
  app: App;
  connection: Connection;
}

export interface FbxResponse extends AxiosResponse {
  data: {
    success: boolean;
    result: Object | Array<Object>;
    error_code?: string;
    uid?: string;
    msg?: string;
  };
}

interface IFreeboxOptions {
  config?: FreeboxConfig | string;
  baseURL?: string;
}

export interface IFreebox {
  login(): Promise<Session>;
  request(requestConfig: AxiosRequestConfig): Promise<AxiosResponse>;
  logout(): Promise<boolean>;
  register(appConfig: App): Promise<string>;
}

export default class Freebox implements IFreebox {
  readonly localURL: string = localURL;
  readonly configRootPath: string = `${appRoot}/freebox.config.json`;
  readonly authorizationStatus: { [index: string]: string } = {
    unknown: "the app_token is invalid or has been revoked",
    pending: "the user has not confirmed the authorization request yet",
    timeout:
      "the user did not confirmed the authorization within the given time",
    granted: "the app_token is valid and can be used to open a session",
    denied: "the user denied the authorization request"
  };
  readonly authentificationErrors: { [index: string]: string } = {
    auth_required: "Invalid session token, or not session token sent",
    invalid_token:
      "The app token you are trying to use is invalid or has been revoked",
    pending_token:
      "The app token you are trying to use has not been validated by user yet",
    insufficient_rights:
      "Your app permissions does not allow accessing this API",
    denied_from_external_ip:
      "You are trying to get an app_token from a remote IP",
    invalid_request: "Your request is invalid",
    ratelimited: "Too many auth error have been made from your IP",
    new_apps_denied: "New application token request has been disabled",
    apps_denied: "API access from apps has been disabled",
    internal_error: "Internal error"
  };
  private baseURL: string = this.localURL;
  private axios: AxiosInstance = axios.create();
  private configType: string;
  session?: Session;
  configPath?: string;
  config?: FreeboxConfig;

  constructor(options: IFreeboxOptions = {}) {
    const { config, baseURL } = options;
    if (typeof config === "object") {
      if (!config.app) {
        throw new Error('Missing "app" part in your configuration object.');
      }

      this.config = config;
      this.baseURL = baseURL || this.localURL;

      this.configType = "json";
    } else if (typeof config === "string") {
      this.configPath = config;
      this.configType = "path";
    } else {
      this.configPath = this.configRootPath;
      this.configType = "path"; //rootPath
    }
  }

  private async initialize() {
    // Set this.config for config file case
    if (this.configType === "path" && !this.config) {
      this.config = await this.getConfigFromConfigFile();
    }

    // Set Axios instance to prepare following requests
    if (!this.axios) await this.setAxios();
  }

  public async login(): Promise<Session> {
    await this.initialize();

    if (!this.config) {
      throw new Error("Missing Freebox Configuration");
    }

    // Set connection
    const hasAPIDomain =
      this.config.connection &&
      this.config.connection.api_domain &&
      typeof this.config.connection.api_domain === "string";
    const hasHTTPSPort =
      this.config.connection &&
      this.config.connection.https_port &&
      typeof this.config.connection.https_port === "number";
    const hasConnection = hasAPIDomain && hasHTTPSPort;
    if (!hasConnection) {
      if (this.configType === "path") {
        log.warn("Missing 'connection' part in your Freebox Config file.");
      } else if (this.configType === "json") {
        log.warn("Missing 'connection' part in your Freebox Config.");
      }
      const { api_domain, https_port } = await this.getConnection();

      this.config.connection = {
        api_domain,
        https_port
      };

      if (this.configType === "path") {
        await this.updateConfigFile();
        log.success(
          "Freebox Config file updated with success: 'connection' part updated."
        );
      } else if (this.configType === "json") {
        log.info(
          `Please update your configuration object with the following for next connections: \n ${JSON.stringify(
            this.config,
            null,
            2
          )}`
        );
      }
    }

    // Register application to get app_token
    const hasAppToken =
      this.config.app &&
      this.config.app.app_token &&
      typeof this.config.app.app_token === "string";
    if (!hasAppToken) {
      if (this.configType === "path") {
        log.warn("Missing app_token in your Freebox Config file.");
      } else if (this.configType === "json") {
        log.warn("Missing app_token in your Freebox Config.");
      }

      log.info(
        "Please check your Freebox Server screen to authorize application access and get your app_token."
      );

      try {
        this.config.app.app_token = await this.register(this.config.app);
        log.success("New Freebox application registered with success !");
      } catch (err) {
        console.error(
          "Failed to register your application to get your application token."
        );
        throw new Error(err);
      }

      if (this.configType === "json") {
        log.warn(
          `Please update your configuration object with the following for next connections: \n ${JSON.stringify(
            this.config,
            null,
            2
          )}`
        );
      } else if (this.configType === "path") {
        await this.updateConfigFile();
        log.success(
          "Freebox Config file updated with success: app_token added."
        );
      } else {
        throw new Error(
          "Cannot log or set app_token to your Freebox configuration."
        );
      }
    }

    // Session configuration
    const challengeRes: Response.getChallenge = await getChallenge(this.axios);
    const { challenge, logged_in } = challengeRes.data.result;
    const sessionStart: SessionStart = {
      app_id: this.config.app.app_id,
      app_version: this.config.app.app_version || "",
      password: {
        app_token: this.config.app.app_token || "",
        challenge
      }
    };

    // Session opening
    const openSessionRes: Response.openSession = await openSession(
      sessionStart,
      this.axios
    );
    const { session_token, permissions } = openSessionRes.data.result;

    // Set Session
    this.session = <Session>{};
    this.session.session_token = session_token;
    this.session.permissions = permissions;

    // Update Axios Instance
    await this.setAxios();

    return this.session;
  }

  public async request(
    requestConfig: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    await this.initialize();

    try {
      const response: AxiosResponse = await this.axios(requestConfig);
      return response;
    } catch (err) {
      if (err.response.status === 403) {
        const fbxErrorCode = err.response.data.error_code;
        const fbxErrorDescription = this.authentificationErrors[fbxErrorCode];
        if (fbxErrorDescription) {
          throw new Error(
            `${fbxErrorDescription} : \n ${JSON.stringify(
              err.response.data,
              null,
              2
            )}`
          );
        }
      }
      throw new Error(err);
    }
  }

  public async logout(): Promise<boolean> {
    await this.initialize();

    // Reset Session
    this.session = <Session>{};

    const response = await this.request({
      method: "post",
      url: "/api/v4/login/logout/"
    });
    return response.data.success;
  }

  public async register(appConfig: App): Promise<string> {
    await this.initialize();
    const res: Response.requestAuthorization = await requestAuthorization(
      appConfig,
      this.axios
    );
    const { app_token, track_id } = res.data.result;
    await this.getAuthorizationStatus(track_id);
    return app_token;
  }

  private async getConnection(): Promise<Connection> {
    await this.initialize();
    const res: DiscoveryResponse = await discovery(this.axios);
    const { https_available, api_domain, api_base_url, https_port } = res.data;

    if (!https_available) {
      throw new Error("HTTPS is not available in your Freebox Server.");
    }

    const connection: Connection = {
      api_domain,
      https_port
    };

    return connection;
  }

  private getAuthorizationStatus(track_id: number): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const self = this;
      async function checkTrackAuthorizationProgress() {
        try {
          const response: Response.trackAuthorizationProgress = await trackAuthorizationProgress(
            track_id,
            self.axios
          );

          const { status } = response.data.result;

          if (status === "pending") {
            return true;
          } else if (status === "granted") {
            clearInterval(intervalTrackAuthorizationProgress);
            resolve(true);
          } else {
            clearInterval(intervalTrackAuthorizationProgress);
            const endStatus = response.data.result.status;
            const errData = response.data;
            reject(
              `${self.authorizationStatus[endStatus]}: \n ${JSON.stringify(
                errData,
                null,
                2
              )}`
            );
          }
        } catch (err) {
          clearInterval(intervalTrackAuthorizationProgress);
          reject(err);
        }
      }

      const intervalTrackAuthorizationProgress = setInterval(
        await checkTrackAuthorizationProgress,
        2 * 1000
      );
    });
  }

  private async setAxios(): Promise<AxiosInstance> {
    const instanceConfig: AxiosRequestConfig = {
      baseURL: this.baseURL,
      headers: {}
    };

    // Set Freebox Session header
    if (this.session && this.session.session_token) {
      instanceConfig.headers["X-Fbx-App-Auth"] = this.session.session_token;
    }

    // Secure HTTPS configuration
    // https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2
    if (this.config && this.config.connection) {
      instanceConfig.httpsAgent = new HttpsAgent({ ca: freeboxRootCA });
      instanceConfig.baseURL = stringifyFreeboxConnection(
        this.config.connection
      );
    }

    this.axios = axios.create(instanceConfig);
    return this.axios;
  }

  private async getConfigFromConfigFile(): Promise<FreeboxConfig> {
    if (!this.configPath) {
      throw new Error(
        "Cannot update Freebox configuration file: no config path specified."
      );
    }
    const fileData = await readFile(this.configPath);
    const config = JSON.parse(String(fileData));
    return config;
  }

  private async updateConfigFile(): Promise<void> {
    if (!this.configPath) {
      throw new Error(
        "Cannot update Freebox configuration file: no config path specified."
      );
    }
    const fileDataUpdated = JSON.stringify(this.config, null, 2);
    await writeFile(this.configPath, fileDataUpdated);
  }
}
