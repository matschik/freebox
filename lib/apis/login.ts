// https://dev.freebox.fr/sdk/os/login/
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { FbxResponse } from "../shared/Freebox";
import { createHmac } from "crypto";
import request from "../shared/request";

export interface Session {
  session_token: string;
  permissions: Permissions;
}

interface Permissions {
  settings?: boolean; // Allow modifying the Freebox settings (reading settings is always allowed)
  contacts?: boolean; // Access to contact list
  calls?: boolean; // Access to call logs
  explorer?: boolean; // Access to filesystem
  downloader?: boolean; // Access to downloader
  parental?: boolean; // Access to parental control
  pvr?: boolean;
}

export interface SessionStart {
  app_id: string;
  password: string | { app_token: string; challenge: string };
  app_version?: string;
}

interface App {
  app_id: string;
  app_name: string;
  app_version?: string;
  device_name: string;
  app_token?: string;
}

export namespace Response {
  export interface getChallenge extends FbxResponse {
    data: {
      success: boolean;
      result: {
        challenge: string;
        logged_in: boolean;
      };
    };
  }

  export interface openSession extends FbxResponse {
    data: {
      success: boolean;
      result: Session;
    };
  }

  export interface requestAuthorization extends FbxResponse {
    data: {
      success: boolean;
      result: {
        app_token: string;
        track_id: number;
      };
    };
  }

  export interface trackAuthorizationProgress extends FbxResponse {
    data: {
      success: boolean;
      result: {
        status: string;
        challenge: string;
      };
    };
  }
}

export async function openSession(
  sessionStart: SessionStart,
  axiosInstance?: AxiosInstance
): Promise<Response.openSession> {
  // SessionStart's Password build
  if (
    sessionStart.password &&
    typeof sessionStart.password === "object" &&
    typeof sessionStart.password.app_token === "string" &&
    typeof sessionStart.password.challenge === "string"
  ) {
    const app_token = sessionStart.password.app_token;
    const challenge = sessionStart.password.challenge;
    sessionStart.password = createHmac("sha1", app_token)
      .update(challenge)
      .digest("hex");
  }

  const requestConfig: AxiosRequestConfig = {
    method: "post",
    url: "login/session/",
    data: sessionStart
  };

  const response = await request(requestConfig, axiosInstance);
  return response;
}

export async function getChallenge(
  axiosInstance?: AxiosInstance | AxiosRequestConfig
): Promise<Response.getChallenge> {
  const requestConfig: AxiosRequestConfig = {
    method: "get",
    url: "login/"
  };

  const response = await request(requestConfig, axiosInstance);
  return response;
}

export async function requestAuthorization(
  appConfig: App,
  axiosInstance?: AxiosInstance | AxiosRequestConfig
): Promise<Response.requestAuthorization> {
  const requestConfig: AxiosRequestConfig = {
    method: "post",
    url: "login/authorize/",
    data: appConfig
  };

  const response = await request(requestConfig, axiosInstance);
  return response;
}

export async function trackAuthorizationProgress(
  track_id: number,
  axiosInstance?: AxiosInstance | AxiosRequestConfig
): Promise<Response.trackAuthorizationProgress> {
  if (!track_id) throw new Error("Missing argument: track_id");

  const requestConfig: AxiosRequestConfig = {
    method: "get",
    url: `login/authorize/${track_id}`
  };

  const response = await request(requestConfig, axiosInstance);
  return response;
}
