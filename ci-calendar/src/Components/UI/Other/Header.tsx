import { LinkButton } from "./LinkButton";
import { Button } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

import {
  HomeOutlined,
  LogoutOutlined,
  LoginOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { TfiLayoutAccordionMerged } from "react-icons/tfi";

import FilterModel from "./FilterModel";
import { DbUser } from "../../../util/interfaces";
import { useParamsHandler } from "../../../hooks/useParamsHandler";
import { viewOptions } from "../../../util/options";

export default function Header() {
  const { currentUser, logoutContext } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentValues: viewCurrentValues,
    onOptionsChange,
    clearSearchParams,
  } = useParamsHandler({ title: "view", options: viewOptions });

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
    onOptionsChange("view")(["list"]);
    logoutContext();
    navigate("/");
  };

  const handleViewChange = () => {
    if (viewCurrentValues.length === 0) {
      onOptionsChange("view")(["calendar"]);
    } else {
      clearSearchParams(["view"]);
    }
  };
  return (
    <section className="header-container">
      {currentUser && (
        <Button
          // className=" flex items-center justify-center text-white text-sm mr-6 sm:mr-2 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
          className="header-btn primary"
          onClick={handleLogOut}
        >
          <LogoutOutlined />
        </Button>
      )}
      {!currentUser && currentPath !== "/login" && (
        <LinkButton
          to="/login"
          // className="text-white text-sm mr-6 sm:mr-2 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
          className="header-btn primary"
        >
          <LoginOutlined />
        </LinkButton>
      )}

      {currentUser && <UserInfo currentUser={currentUser} />}
      <FilterModel />
      {currentPath !== "/" ? (
        // <LinkButton to="/" className="text-black text-sm mr-2 font-semibold">
        <LinkButton to="/" className="header-btn">
          <HomeOutlined />
        </LinkButton>
      ) : (
        <Button
          onClick={handleViewChange}
          type={viewCurrentValues.length ? "primary" : "default"}
        >
          <TfiLayoutAccordionMerged />
        </Button>
      )}
      {currentUser && (
        <div className="ml-auto flex ">
          <LinkButton
            to={settingsPage}
            className="text-white text-sm mr-6 sm:mr-2 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
          >
            <SettingOutlined />
          </LinkButton>
        </div>
      )}
    </section>
  );
}

interface IUserInfoProps {
  currentUser: DbUser;
}
const UserInfo = ({ currentUser }: IUserInfoProps) => {
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
