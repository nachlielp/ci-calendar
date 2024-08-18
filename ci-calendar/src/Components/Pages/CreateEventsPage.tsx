import { Icon } from "../UI/Other/Icon";
import { useWindowSize } from "../../hooks/useWindowSize";
import AddEventModal from "../UI/EventForms/AddEventModal";
import { AddEventDrawer } from "../UI/EventForms/AddEventDrawer";
export default function CreateEventsPage() {
  const { width } = useWindowSize();
  const isMobile = width < 600;
  return (
    <section className="create-events-page">
      <article className="btns-container">
        {isMobile ? (
          <AddEventDrawer
            anchorEl={
              <button className="btn">
                <Icon icon="noteStackAdd" />
                אירוע רב יומי
              </button>
            }
            eventType="multi-day"
          />
        ) : (
          <AddEventModal
            anchorEl={
              <button className="btn">
                <Icon icon="noteStackAdd" />
                אירוע רב יומי
              </button>
            }
            eventType="multi-day"
          />
        )}

        {isMobile ? (
          <AddEventDrawer
            anchorEl={
              <button className="btn">
                <Icon icon="noteStackAdd" />
                אירוע רב יומי
              </button>
            }
            eventType="single-day"
          />
        ) : (
          <AddEventModal
            anchorEl={
              <button className="btn">
                <Icon icon="addBox" />
                אירוע חד יומי
              </button>
            }
            eventType="single-day"
          />
        )}
      </article>
    </section>
  );
}
