import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import '@goongmaps/goong-js/dist/goong-js.css';

createRoot(document.getElementById("root")!).render(<App />);
