// main.jsx - the very first file React runs.
// It finds <div id="root"> in index.html and draws our <App /> inside it.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter lets us have pages like /employees and /attendance */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
