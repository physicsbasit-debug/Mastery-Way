import React from "react";
import ReactDOM from "react-dom/client";
// Bundled Arabic typeface: self-hosted so it also renders inside the PDF export frame.
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource/tajawal/900.css';
import "./index.css";
import App from "./app";
import { installBrowserSupportAttributes } from "./shared/browserSupport";

installBrowserSupportAttributes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);