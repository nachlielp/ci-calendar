import { LinkButton } from "./UI/LinkButton";

function AdminPage() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-10">
      <LinkButton to="/bio" className="w-24 h-24 m-4">
        פרופיל אישי
      </LinkButton>
      <LinkButton to="/edit-events-list" className="w-24 h-24 m-4">
        עריכת אירועים
      </LinkButton>
      <LinkButton to="/event-form" className="w-24 h-24 m-4">
        הוסף אירוע
      </LinkButton>
      <LinkButton to="/manage-users" className="w-24 h-24 m-4">
        הגדרת <br /> משתמשים
      </LinkButton>
    </div>
  );
}

export default AdminPage;
