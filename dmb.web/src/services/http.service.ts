import axios from "axios";
import { dmbApiConfig } from "../config";

const http = axios.create({
  baseURL: dmbApiConfig.dmb_api_url,
  headers: {
    "Content-type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");
    const isAuthEndpoint = /\/auth\/(login|logout)/i.test(requestUrl);

    if (status === 401 && !isAuthEndpoint && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("dmb:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default http;
