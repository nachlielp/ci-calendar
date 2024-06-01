import { LinkButton } from "../UI/Other/LinkButton";

function TeacherPage() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-10">
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/bio" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          פרופיל  אישי
        </LinkButton>
        <LinkButton to="/manage-events" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הארועים שלי
        </LinkButton>
      </div>
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/event-form" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הוסף אירוע  חד יומי
        </LinkButton>
        <LinkButton to="/multi-day-event-form" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הוסף ארוע  רב יומי
        </LinkButton>
      </div>
    </div>
  );
}

export default TeacherPage;
