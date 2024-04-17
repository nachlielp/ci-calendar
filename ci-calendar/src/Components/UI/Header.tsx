import { LinkButton } from "./LinkButton";
import { Button } from "antd";
import { useAuthContext } from "../Auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

import {
  HomeOutlined,
  LogoutOutlined,
  LoginOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import FilterModel from "./FilterModel";
import { DbUser } from "../../util/interfaces";

export default function Header() {
  const { currentUser, logoutContext } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  let settingsPage = "/";
  if (currentUser?.userType === "admin") {
    settingsPage = "/admin";
  } else if (currentUser?.userType === "user") {
    settingsPage = "/user";
  } else if (currentUser?.userType === "teacher") {
    settingsPage = "/teacher";
  }

  const currentPath = location.pathname;

  const handleLogOut = () => {
    logoutContext();
    navigate("/");
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
          <LinkButton
            to="/login"
            className="text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
          >
            <LoginOutlined />
          </LinkButton>
        )}

        {currentUser && <UserInfo currentUser={currentUser} />}
        <FilterModel />
        {currentPath !== "/" && currentPath !== "/" && (
          <LinkButton to="/" className="text-black text-sm mr-6 font-semibold">
            <HomeOutlined />
          </LinkButton>
        )}
        {currentUser && (
          <>
            {/* <div className="ml-auto  md:hidden">
              <SideMenu />
            </div> */}
            <div className="ml-auto flex ">
              <LinkButton
                to={settingsPage}
                className="text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
              >
                <SettingOutlined />
              </LinkButton>
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
          <p className="text-black text-sm font-semibold">
            {currentUser.fullName}
          </p>
          <p className="text-gray-400 text-xs font-semibold">
            {currentUser.email}
          </p>
        </div>
      )}
    </div>
  );
};
