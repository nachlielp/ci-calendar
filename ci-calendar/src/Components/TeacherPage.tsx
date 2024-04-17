import { LinkButton } from "./UI/LinkButton";

function TeacherPage() {
  return (
    <div className="flex flex-row items-center justify-center mt-10">
      <LinkButton to="/bio" className="w-24 h-24 m-4">
        פרופיל אישי
      </LinkButton>
      <LinkButton to="/edit-events-list" className="w-24 h-24 m-4">
        הארועים שלי
      </LinkButton>
      <LinkButton to="/event-form" className="w-24 h-24 m-4">
        הוסף אירוע
      </LinkButton>
      <LinkButton to="/test" className="w-24 h-24 m-4">
        test
      </LinkButton>
    </div>
  );
}

export default TeacherPage;
