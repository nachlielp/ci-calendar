import { LinkButton } from "./LinkButton";
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
        <button
          className="btn-main"
          onClick={handleLogOut}
        >
          <Icon icon="logout" />
        </button>
      )}
      {!currentUser && currentPath !== "/login" && (
        <LinkButton
          to="/login"
          className="header-btn no-border"
        >
          התחבר/י
          &nbsp;
          <Icon icon="account" className="icon-main" />
        </LinkButton>
      )}

      {currentUser && <UserInfo currentUser={currentUser} />}
      {currentPath !== "/" && (
        <LinkButton to="/" className="header-btn">
          <Icon icon="home" />
        </LinkButton>
      )}
      {currentUser && (
        <div className="header-actions">
          <LinkButton
            to={settingsPage}
            className="header-btn "
          >
            <Icon icon="settings" />
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
        <div className={`user-info-container`}>
          <p className={`user-name`}>
            {currentUser.fullName}
          </p>
          <p className={`user-email`}>
            {currentUser.email}
          </p>
        </div>
      )}
    </div>
  );
};
