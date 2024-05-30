import { LinkButton } from "./LinkButton";
import { Button } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { DbUser } from "../../../util/interfaces";
import { useParamsHandler } from "../../../hooks/useParamsHandler";
import { viewOptions } from "../../../util/options";
import { Icon } from "./Icon";

export default function Header() {
  const { currentUser, logoutContext } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    onOptionsChange,
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


  return (
    <section className="header-container">
      {currentUser && (
        <Button
          className="header-btn "
          onClick={handleLogOut}
        >
          <Icon icon="logout" className="w-6 h-6 " />
        </Button>
      )}
      {!currentUser && currentPath !== "/login" && (
        <LinkButton
          to="/login"
          className="header-btn no-border"
        >
          <Icon icon="account" className="w-6 h-6 " />
          &nbsp; התחבר/י
        </LinkButton>
      )}

      {currentUser && <UserInfo currentUser={currentUser} />}
      {currentPath !== "/" && (
        <LinkButton to="/" className="header-btn">
          <Icon icon="home" className="w-6 h-6 " />
        </LinkButton>
      )}
      {currentUser && (
        <div className="ml-auto flex ">
          <LinkButton
            to={settingsPage}
            className="header-btn "
          >
            <Icon icon="settings" className="w-6 h-6 " />
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
