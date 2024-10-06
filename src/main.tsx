import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";
import Providers from "./Providers.tsx";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Providers>
      <App />
    </Providers>
  </BrowserRouter>
);
