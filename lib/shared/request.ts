import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { localURL } from "../shared/utils";

export default async function request(
  requestConfig: AxiosRequestConfig,
  axiosInstance?: AxiosInstance | AxiosRequestConfig
): Promise<AxiosResponse> {
  let instance: AxiosInstance = axios;

  if (axiosInstance) {
    if (typeof axiosInstance === "object") {
      instance = axios.create(axiosInstance);
    } else if (typeof axiosInstance === "function") {
      instance = axiosInstance;
    } else {
      throw new Error(
        "Invalid argument 'instance' must be a AxiosRequestConfig or AxiosInstance."
      );
    }
  }

  if (!instance.defaults.baseURL) {
    instance.defaults.baseURL = localURL;
  }

  const response = await instance(requestConfig);
  return response;
}
