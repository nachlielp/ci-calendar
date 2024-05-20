import { LinkButton } from "../UI/Other/LinkButton";

function TeacherPage() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-10">
      <LinkButton to="/bio" className="w-24 h-24 m-4">
        פרופיל אישי
      </LinkButton>
      {/* <LinkButton to="/edit-events-list" className="w-24 h-24 m-4">
        הארועים שלי
      </LinkButton> */}
      <LinkButton to="/manage-events" className="w-24 h-24 m-4">
        הארועים שלי
      </LinkButton>
      <LinkButton to="/event-form" className="w-24 h-24 m-4">
        הוסף אירוע <br /> חד יומי
      </LinkButton>
      <LinkButton to="/multi-day-event-form" className="w-24 h-24 m-4">
        הוסף ארוע <br /> רב יומי
      </LinkButton>
    </div>
  );
}

export default TeacherPage;
