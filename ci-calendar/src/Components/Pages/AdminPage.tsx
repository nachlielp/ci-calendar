import { LinkButton } from "../UI/Other/LinkButton";

function AdminPage() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-10">
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/bio" className="w-24 h-24 m-4">
          פרופיל אישי
        </LinkButton>
        <LinkButton to="/manage-events" className="w-24 h-24 m-4">
          עריכת אירועים
        </LinkButton>
      </div>
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/event-form" className="w-24 h-24 m-4">
          הוסף אירוע <br /> חד יומי
        </LinkButton>
        <LinkButton to="/multi-day-event-form" className="w-24 h-24 m-4">
          הוסף ארוע <br /> רב יומי
        </LinkButton>
      </div>
      <div className="flex flex-row items-center justify-center">
        <LinkButton to="/manage-users" className="w-24 h-24 m-4">
          הגדרת <br /> משתמשים
        </LinkButton>
      </div>
    </div>
  );
}

export default AdminPage;
