import { useUser } from "../../context/UserContext";
import UserForm from "../UI/UserForms/UserForm";

export default function UserPage() {
  const { user } = useUser();
  if (!user) {
    throw new Error("user is null, make sure you're within a Provider");
  }
  return <UserForm user={user} />;
}
