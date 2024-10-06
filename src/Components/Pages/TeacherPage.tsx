import { LinkButton } from "../UI/Other/LinkButton";

//TODO flex grid
export default function TeacherPage() {
  return (
    <div className="teacher-page-container">
      <div className="teacher-page-row">
        <LinkButton to="/user" className="teacher-page-button">
          פרופיל  אישי
        </LinkButton>
        <LinkButton to="/bio" className="teacher-page-button">
          פרופיל ציבורי
        </LinkButton>
        <LinkButton to="/manage-events" className="teacher-page-button">
          הארועים שלי
        </LinkButton>
      </div>
      <div className="teacher-page-row">
        <LinkButton to="/event-form" className="teacher-page-button">
          הוסף אירוע  חד יומי
        </LinkButton>
        <LinkButton to="/multi-day-event-form" className="teacher-page-button">
          הוסף ארוע  רב יומי
        </LinkButton>
      </div>
    </div>
  );
}

