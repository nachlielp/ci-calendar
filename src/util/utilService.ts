import dayjs from "dayjs"
import { DbUser, UserType } from "./interfaces"
import { User } from "@supabase/supabase-js"
import { hebrewMonths, SelectOption } from "./options"
export const utilService = {
    createDbUserFromUser,
    deepCompare,
    formatHebrewDate,
    hebrewDay,
}

function createDbUserFromUser(user: User): DbUser {
    console.log(user)
    return {
        user_id: user.id,
        user_type: UserType.user,
        full_name: user.user_metadata.name || "",
        email: user.email || "",
        phone: user.phone || "",
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        subscribed_for_updates_at: new Date().toISOString(),
        newsletter: {
            createdAt: "",
            updatedAt: "",
            subscribedForUpdatesAt: "",
            active: false,
            districts: [],
            eventTypes: [],
        },
        page_url: "",
        page_title: "",
        show_profile: false,
        allow_tagging: false,
        img: "", // Add this line
        bio: "",
        provider: user.app_metadata["provider"] || "",
    }
}

function deepCompare(obj1: any, obj2: any): boolean {
    // Check if both inputs are objects
    if (
        typeof obj1 !== "object" ||
        typeof obj2 !== "object" ||
        obj1 === null ||
        obj2 === null
    ) {
        return obj1 === obj2
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) {
        return false
    }

    // Compare each key-value pair recursively
    for (const key of keys1) {
        if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
            return false
        }
    }

    return true
}

function formatHebrewDate(date: string) {
    const hebrewDate = dayjs(date)
    const day = hebrewDate.format("D")
    const month = hebrewDate.format("MM")
    const hebrewMonth = hebrewMonths.find(
        (m: SelectOption) => m.value === month
    )?.label
    return `${hebrewDay(date)} ${day} ב${hebrewMonth}`
}

function hebrewDay(date: string) {
    switch (dayjs(date).locale("he").format("dd")) {
        case "Su":
            return "יום ראשון"
        case "Mo":
            return "יום שני"
        case "Tu":
            return "יום שלישי"
        case "We":
            return "יום רביעי"
        case "Th":
            return "יום חמישי"
        case "Fr":
            return "יום שישי"
        case "Sa":
            return "יום שבת"
        default:
            return ""
    }
}
