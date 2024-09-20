import {DbUser, UserType} from "./interfaces";
import {User} from "@supabase/supabase-js";
export const utilService = {
    createDbUserFromUser,
    deepCompare
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
      newsletter: {
        createdAt: "",
        updatedAt: "",
        subscribedForUpdatesAt: "",
        active: false,
        districts: [],
        eventTypes: [],
      },
      pageUrl: "",
      pageTitle: "",
      showProfile: false,
      allowTagging: false,
      img: "", // Add this line
    bio: "",
    };
  }

  function deepCompare(obj1: any, obj2: any): boolean {
    // Check if both inputs are objects
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) {
      return false;
    }

    // Compare each key-value pair recursively
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }