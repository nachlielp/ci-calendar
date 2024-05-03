import { useAuthContext } from "../Auth/AuthContext";
import UserForm from "../UI/UserForms/UserForm";

export default function UserPage() {
  //TODO import currentUser directly
  const { currentUser } = useAuthContext();
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }
  return <UserForm user={currentUser} />;
}
