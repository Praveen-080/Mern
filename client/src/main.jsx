import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // ✅ optional, enables navbar toggler
import { createRoot } from "react-dom/client";
import App from "./App";
import axios from "axios";

// Configure axios for API calls
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const root = createRoot(document.getElementById("root"));
root.render(<App />);
