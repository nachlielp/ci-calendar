import { useState, useEffect } from "react";
import { getUserByUid, updateUserByUid } from "../db";
import { DbUser, UserType } from "../../drizzle/schema";

export const useGetUser = (uid: string) => {
  const [user, setUser] = useState<DbUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserByUid(uid);
      if (userData) {
        const user: DbUser = {
          ...userData,
          userType: convertUserType(userData.userType),
        };
        setUser(user);
      } else {
        setUser(null);
      }
    };

    fetchUser();
  }, [uid]);

  return user;
};

export const useUpdateUser = (uid: string, partialUser: Partial<DbUser>) => {
  let res;
  useEffect(() => {
    const updateUser = async () => {
      await updateUserByUid(uid, partialUser);
    };
    res = updateUser();
  }, [uid, partialUser]);
  return res;
};

const convertUserType = (userType: string): UserType => {
  // Example conversion logic, adjust based on actual UserType definition
  if (userType === "Admin") return UserType.admin;
  if (userType === "User") return UserType.user;
  throw new Error("Invalid user type");
};
