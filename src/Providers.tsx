import React from "react";
import { SessionProvider } from "./context/SessionContext";
import { UserProvider } from "./context/UserContext";
import { ConfigProvider } from "antd";
interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ConfigProvider direction="rtl">
      <SessionProvider>
        <UserProvider>{children}</UserProvider>
      </SessionProvider>
    </ConfigProvider>
  );
};

export default Providers;
