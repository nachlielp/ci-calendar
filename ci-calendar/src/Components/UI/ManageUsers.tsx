import { AutoComplete, Button, Card, Input, SelectProps } from "antd";
import { useState } from "react";
import { DbUser, UserType } from "../../util/interfaces";
import { useUsers } from "../../hooks/useUsers";
import { useWindowSize } from "../../hooks/useWindowSize";
import { useAuthContext } from "../Auth/AuthContext";

const searchResult = (query: string, users: DbUser[]) => {
  return users
    .filter(
      (user) =>
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
    )
    .map((user) => ({
      value: user.id,
      label: (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            {user.fullName} - {user.email}
          </span>
        </div>
      ),
    }));
};

function ManageUsers() {
  const [options, setOptions] = useState<SelectProps<DbUser>["options"]>([]);
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const { users } = useUsers();
  const { width } = useWindowSize();
  const { updateUser } = useAuthContext();

  const handleSearch = (value: string) => {
    setInputValue(value);
    setOptions(value ? searchResult(value, users) : []);
  };

  const onSelect = (value: string) => {
    console.log(`ManageUsers.onSelect.value: `, value);
    const user = users.find((user) => user.id === value);
    if (user) {
      setSelectedUser(user);
      setInputValue(user.fullName);
    }
  };

  const onMakeAdmin = async () => {
    if (!selectedUser) return;
    try {
      await updateUser({ ...selectedUser, userType: UserType.admin });
      setSelectedUser({ ...selectedUser, userType: UserType.admin });
    } catch (error) {
      console.error(`ManageUsers.onMakeAdmin.error: `, error);
      throw error;
    }
  };
  const onMakeTeacher = async () => {
    if (!selectedUser) return;
    try {
      await updateUser({ ...selectedUser, userType: UserType.teacher });
      setSelectedUser({ ...selectedUser, userType: UserType.teacher });
    } catch (error) {
      console.error(`ManageUsers.onMakeTeacher.error: `, error);
      throw error;
    }
  };
  const onMakeUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser({ ...selectedUser, userType: UserType.user });
      setSelectedUser({ ...selectedUser, userType: UserType.user });
    } catch (error) {
      console.error(`ManageUsers.onMakeUser.error: `, error);
      throw error;
    }
  };
  const cardWidth = Math.min(width * 0.9, 500);

  const makeAdmin = (
    <Button disabled={selectedUser?.userType === "admin"} onClick={onMakeAdmin}>
      הגדר כמנהל
    </Button>
  );
  const makeTeacher = (
    <Button
      disabled={selectedUser?.userType === "teacher"}
      onClick={onMakeTeacher}
    >
      הגדר כמורה
    </Button>
  );
  const makeUser = (
    <Button disabled={selectedUser?.userType === "user"} onClick={onMakeUser}>
      הגדר כמשתמש
    </Button>
  );
  const footer = selectedUser ? [makeAdmin, makeTeacher, makeUser] : [];

  return (
    <div className="flex justify-center">
      <Card
        className="flex flex-col gap-4 mt-4  w-full max-w-[500px] sm:max-w-[90%]"
        style={{ maxWidth: `${cardWidth}px` }}
        title="הגדרת משתמשים"
        actions={footer}
      >
        <AutoComplete
          style={{ width: "100%" }}
          options={options}
          onSelect={onSelect}
          onSearch={handleSearch}
          size="large"
          value={inputValue} // Controlled component
        >
          <Input.Search
            size="large"
            placeholder="שם משתמשים או כתובת מייל"
            enterButton
          />
        </AutoComplete>
        {selectedUser && (
          <div>
            <p>{selectedUser.fullName}</p>
            <p>{selectedUser.email}</p>
            <p>{selectedUser.userType}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ManageUsers;
