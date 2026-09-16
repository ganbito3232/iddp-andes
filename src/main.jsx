import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Avisos from "./components/Avisos.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <Avisos />
  </StrictMode>,
);
