import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app";
import { installBrowserSupportAttributes } from "./shared/browserSupport";

installBrowserSupportAttributes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);