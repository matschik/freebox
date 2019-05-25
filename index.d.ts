import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

interface AppIdentity {
  app_id?: string;
  app_name?: string;
  app_version?: string;
  device_name?: string;
}

interface RegisterOptions {
  silent?: boolean;
}

interface SessionStart {
  app_id: string;
  app_version?: string;
  password: string;
}

interface Access {
  app_token: string;
  app_id: string;
  api_domain?: string;
  https_port?: number;
  api_base_url: string;
  api_version: string;
}

declare class FreeboxRegister {
  constructor(appIdentity?: AppIdentity);
  register(options?: RegisterOptions): Access;
  request(requestConfig: AxiosRequestConfig): AxiosResponse;
  discovery(): AxiosResponse;
  requestAuthorization(): AxiosResponse;
  getAuthorizationStatus(track_id: number | string): boolean | AxiosError;
  trackAuthorizationProgress(track_id: number | string): AxiosResponse;
}

declare class Freebox {
  constructor(access: Access);
  request(requestConfig: AxiosRequestConfig): AxiosResponse;
  login(): void;
  openSession(sessionStart: SessionStart): AxiosResponse;
  getChallenge(): AxiosResponse;
  logout(): AxiosResponse;
}

export = {
  FreeboxRegister,
  Freebox,
};
