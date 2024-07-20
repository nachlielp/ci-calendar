import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";
// import "antd/dist/reset.css";
import { ConfigProvider } from "antd";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConfigProvider direction="rtl">
    <App />
  </ConfigProvider>
);
