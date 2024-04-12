import { eq, asc, between, inArray } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { DbUser, UserType } from "../drizzle/schema";

const client = createClient({
  url: import.meta.env.VITE_NEXT_DEV_DATABASE_URL || "",
  authToken: import.meta.env.VITE_NEXT_DEV_DATABASE_AUTH_TOKEN || "",
});
const db = drizzle(client, { schema });

// type NewUser = typeof schema.users.$inferInsert;
type NewEvent = typeof schema.events.$inferInsert;

export const insertUser = async (user: DbUser) => {
  try {
    const res = await db.insert(schema.users).values(user);
    if (res.rowsAffected === 1) {
      return user;
    } else {
      throw Error(`drizzle.insertUser.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.insertUser.e: ", error);
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    return user;
  } catch (error) {
    console.error("drizzle.index.getUserByEmail.e: ", error);
  }
};

export const getUserByUid = async (uid: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, uid),
    });
    console.log("drizzle.index.getUserByUid.user", user);
    if (user === undefined) {
      throw Error(`User with UID ${uid} not found.`);
    }
    return user;
  } catch (error) {
    console.error("drizzle.index.getUserByUid.e: ", error);
  }
};

export const getUserByTypes = async (userTypes: UserType[]) => {
  try {
    const users = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.userType, userTypes));
    return users;
  } catch (error) {
    console.error("drizzle.getUserByTypes.e: ", error);
  }
};

export const updateUserByUid = async (user: DbUser) => {
  try {
    const res = await db
      .update(schema.users)
      .set(user)
      .where(eq(schema.users.id, user.id));
    return res;
  } catch (error) {
    console.error("drizzle.updateUserByUid.e: ", error);
  }
};
export const updateUserTypeByEmail = async (
  email: string,
  userType: UserType
) => {
  try {
    const res = await db
      .update(schema.users)
      .set({ userType })
      .where(eq(schema.users.email, email));
    return res;
  } catch (error) {
    console.error("drizzle.updateUserType.e: ", error);
  }
};

export const updateUserNameAndReceiveWeeklyEmails = async (
  userId: string,
  newName: string,
  receiveWeeklyEmails: boolean
) => {
  try {
    const res = await db
      .update(schema.users)
      .set({ name: newName, receiveWeeklyEmails: receiveWeeklyEmails })
      .where(eq(schema.users.id, userId));
    if (res.rowsAffected === 1) {
      return { id: userId };
    } else {
      throw Error(`drizzle.updateUserName.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.updateUserName.e: ", error);
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const res = await db
      .delete(schema.users)
      .where(eq(schema.users.id, userId));
    if (res.rowsAffected === 1) {
      return { id: userId };
    } else {
      throw Error(`drizzle.deleteUser.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.deleteUser.e: ", error);
  }
};

export const insertEvent = async (event: NewEvent) => {
  try {
    const res = await db.insert(schema.events).values(event);
    if (res.rowsAffected === 1) {
      return { id: event.id };
    } else {
      throw Error(`drizzle.insertEvent.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.insertEvent.e: ", error);
  }
};

export const updateEvent = async (event: NewEvent) => {
  try {
    const res = await db
      .update(schema.events)
      .set(event)
      .where(eq(schema.events.id, event.id));
    if (res.rowsAffected === 1) {
      return { id: event.id };
    } else {
      throw Error(`drizzle.updateEvent.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.updateEvent.e: ", error);
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const res = await db
      .delete(schema.events)
      .where(eq(schema.events.id, eventId));
    if (res.rowsAffected === 1) {
      return { id: eventId };
    } else {
      throw Error(`drizzle.deleteEvent.res: ${JSON.stringify(res)}`);
    }
  } catch (error) {
    console.error("drizzle.deleteEvent.e: ", error);
  }
};

export const getEvents = async (from: string, to: string) => {
  try {
    const events = await db
      .select()
      .from(schema.events)
      .where(between(schema.events.startTime, from, to))
      .orderBy(asc(schema.events.startTime));
    return events;
  } catch (error) {
    console.error("drizzle.getEvents.e: ", error);
  }
};

//TODO verify that it gets events for teacher that shares event
export const getEventsByOwnerId = async (userId: string) => {
  try {
    const events = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.owners, userId));
    return events;
  } catch (error) {
    console.error("drizzle.getEventsByUser.e: ", error);
  }
};

export const getEventById = async (eventId: string) => {
  try {
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId));
    return event;
  } catch (error) {
    console.error("drizzle.getEventById.e: ", error);
  }
};
