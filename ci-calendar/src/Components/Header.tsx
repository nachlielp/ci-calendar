import { ButtonLink } from "./UI/LinkButton";
import { Button } from "antd";
import { useAuth } from "./Auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

import {
  HomeOutlined,
  LogoutOutlined,
  LoginOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import SideMenu from "./SideMenu";
import { DbUser } from "../../drizzle/schema";

export default function Header() {
  const authContext = useAuth();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser, logout } = authContext;
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const handleLogOut = () => {
    logout();
    navigate("/home");
  };
  return (
    <div className="container mx-auto px-0">
      <div className="flex h-14 w-full shrink-0 items-center px-4 md:px-6 bg-white sticky top-0">
        {currentUser && (
          <Button
            className=" flex items-center justify-center text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
            onClick={handleLogOut}
          >
            <LogoutOutlined />
          </Button>
        )}
        {!currentUser && currentPath !== "/login" && (
          <ButtonLink
            to="/login"
            className="text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
          >
            <LoginOutlined />
          </ButtonLink>
        )}
        {currentPath !== "/home" && currentPath !== "/" && (
          <ButtonLink
            to="/home"
            className="text-black text-sm mr-6 font-semibold"
          >
            <HomeOutlined />
          </ButtonLink>
        )}
        {currentUser && <UserInfo currentUser={currentUser} />}
        {currentUser && (
          <>
            <div className="ml-auto  md:hidden">
              <SideMenu />
            </div>
            <div className="ml-auto flex hidden md:flex">
              <ButtonLink
                to="/user"
                className="text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
              >
                <UserOutlined />
              </ButtonLink>
              <ButtonLink
                to="/settings"
                className="text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
              >
                <SettingOutlined />
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface IUserInfoProps {
  currentUser: DbUser;
}
const UserInfo = ({ currentUser }: IUserInfoProps) => {
  // console.log("Header.currentUser", currentUser);
  return (
    <div>
      {currentUser && (
        <div className="mr-2 md:mr-6 md:ml-6">
          <p className="text-black text-sm font-semibold">{currentUser.name}</p>
          <p className="text-gray-400 text-xs font-semibold">
            {currentUser.email}
          </p>
        </div>
      )}
    </div>
  );
};
