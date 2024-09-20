import {DbUser, UserType} from "./interfaces";
import {User} from "@supabase/supabase-js";
export const utilService = {
    createDbUserFromUser
}

function createDbUserFromUser(user: User): DbUser {
    return {
      id: user.id,
      userType: UserType.user,
      fullName: user.user_metadata.full_name || "",
      email: user.email || "",
      phoneNumber: user.phone || "",
      createdAt: user.created_at,
      updatedAt: new Date().toISOString(),
      subscribedForUpdatesAt: new Date().toISOString(),
      newsletter: false,
    };
  }