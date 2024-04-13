import { useAuthContext } from "./Auth/AuthContext";
import UserForm from "./UI/UserForm";

export default function UserPage() {
  //TODO import currentUser directly
  const authContext = useAuthContext();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser } = authContext;
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }
  return <UserForm user={currentUser} />;
}
