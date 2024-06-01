import { LinkButton } from "../UI/Other/LinkButton";

function AdminPage() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-10">
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/user" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          פרופיל  אישי
        </LinkButton>
        <LinkButton to="/bio" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          פרופיל ציבורי
        </LinkButton>
        <LinkButton to="/manage-events" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          עריכת אירועים
        </LinkButton>
      </div>
      <div className="flex flex-row items-center justify-center ">
        <LinkButton to="/event-form" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הוסף אירוע  חד יומי
        </LinkButton>
        <LinkButton to="/multi-day-event-form" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הוסף ארוע רב יומי
        </LinkButton>
      </div>
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/manage-users" className="w-24 h-24 m-4 font-bold text-lg flex items-center justify-center text-center break-words whitespace-normal">
          הגדרת  משתמשים
        </LinkButton>
      </div>
    </div>
  );
}

export default AdminPage;
