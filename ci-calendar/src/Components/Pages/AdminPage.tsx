import { LinkButton } from "../UI/Other/LinkButton";

//TODO flex grid
export default function AdminPage() {
  return (
    <div className="teacher-page-container">
      <div className="teacher-page-row">
        <LinkButton to="/user" className="teacher-page-button">
          פרופיל  אישי
        </LinkButton>
        <LinkButton to="/bio" className="teacher-page-button">
          פרופיל ציבורי
        </LinkButton>
      </div>
      <div className="teacher-page-row">
        <LinkButton to="/manage-events" className="teacher-page-button">
          עריכת אירועים
        </LinkButton>
        <LinkButton to="/event-form" className="teacher-page-button">
          הוסף אירוע  חד יומי
        </LinkButton>
      </div>
      <div className="teacher-page-row">
        <LinkButton to="/multi-day-event-form" className="teacher-page-button">
          הוסף ארוע רב יומי
        </LinkButton>
        <LinkButton to="/manage-users" className="teacher-page-button">
          הגדרת  משתמשים
        </LinkButton>
      </div>
    </div>
  );
}
