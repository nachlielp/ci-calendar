import { useState } from "react";
import { Drawer } from "antd";
import SingleDayEventForm from "./SingleDayEventForm";
import MultiDayEventForm from "./MultiDayEventForm";

export function AddEventDrawer({
  anchorEl,
  eventType,
}: {
  anchorEl: any;
  eventType: string;
}) {
  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <div onClick={showDrawer}>{anchorEl}</div>
      <Drawer onClose={onClose} open={open}>
        {eventType === "single-day" ? (
          <SingleDayEventForm />
        ) : (
          <MultiDayEventForm />
        )}
      </Drawer>
    </>
  );
}
