import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ReactNode } from "react";
interface ProvidersProps {
  children: ReactNode;
}
const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default Providers;
