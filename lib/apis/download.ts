// https://dev.freebox.fr/sdk/os/
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import request from "../shared/request";

interface Discovery {
  uid: string;
  device_name: string;
  api_version: string;
  api_base_url: string;
  device_type: string;
  api_domain: string;
  https_available: boolean;
  https_port: number;
}

export interface DiscoveryResponse extends AxiosResponse {
  data: Discovery;
}

export async function getAll(
  axiosInstance?: AxiosInstance | AxiosRequestConfig
): Promise<DiscoveryResponse> {
  const requestConfig: AxiosRequestConfig = {
    method: "get",
    url: "api_version"
  };

  const response = await request(requestConfig, axiosInstance);
  return response;
}
