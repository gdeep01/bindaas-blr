import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Service worker registration failed:", error);
        }
      });
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      )
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Service worker cleanup failed:", error);
        }
      });
  });
}
