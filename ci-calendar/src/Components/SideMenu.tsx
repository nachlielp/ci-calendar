import { useState } from "react";
import { Button, Drawer } from "antd";
import {
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import { ButtonLink } from "./UI/LinkButton";
const SideMenu = () => {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Button
        onClick={showDrawer}
        className=" flex items-center justify-center text-white text-sm mr-6 font-semibold bg-blue-700 p-2 border-white/10 shadow rounded-md hover:bg-blue-900 transition "
      >
        <MenuFoldOutlined />
      </Button>
      <Drawer title="Basic Drawer" onClose={onClose} open={open}>
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
      </Drawer>
    </>
  );
};

export default SideMenu;
