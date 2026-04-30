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

export default http;
