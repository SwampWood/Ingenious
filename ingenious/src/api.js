import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  console.log('API Request URL:', config.url);
  console.log('API Request Headers:', config.headers);
  
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  
  return config;
});

export default api;
