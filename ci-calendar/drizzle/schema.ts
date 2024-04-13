import { sql } from "drizzle-orm/sql/sql";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

//TODO: ma

export enum District {
  north = "north",
  south = "south",
  center = "center",
  jerusalem = "jerusalem",
}

export enum UserType {
  admin = "admin",
  teacher = "teacher",
  user = "user",
}
export interface DbUser {
  id: string;
  createdAt: string;
  updatedAt: string;
  userType: UserType;
  name: string;
  email: string;
  bio: string;
  receiveWeeklyEmails: boolean;
  linkToImage: string;
  linkToPage: string;
}

export enum EventType {
  jam = "jam",
  class = "class",
  workshop = "workshop",
  conference = "conference",
}

export interface SubEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  teacher: string;
  price: number;
  type: EventType;
}

export interface DbSimpleEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  types: EventType[];
  startTime: string;
  endTime: string;
  owners: string[];
  teachers: string;
  linkToEvent: string;
  linkToPayment: string;
  district: District;
  address: string;
  hideEvent: boolean;
  limitations: string[];
  linkToRegistration: string;
  p2_types: EventType[];
  p2_startTime: string;
  p2_endTime: string;
  p2_price: number;
  p2_total_price: number;
}

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  createdAt: text("createdAt")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  userType: text("userType").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  bio: text("bio").notNull(),
  events: blob("events"),
  receiveWeeklyEmails: integer("receiveWeeklyEmails", {
    mode: "boolean",
  }).notNull(),
  linkToImage: text("linkToImage").notNull(),
  linkToPage: text("linkToPage").notNull(),
});

export const simpleEvents = sqliteTable("simpleEvents", {
  id: text("id").primaryKey().notNull(),
  createdAt: text("createdAt")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startTime: text("startTime").notNull(),
  endTime: text("endTime").notNull(),
  owners: text("owners")
    .notNull()
    .references(() => users.id),
  teachers: text("teachers"),
  linkToEvent: text("linkToEvent"),
  linkToPayment: text("linkToPayment"),
  district: text("district").notNull(),
  address: text("address").notNull(),
  hideEvent: integer("hideEvent", { mode: "boolean" }),
  linkToRegistration: text("linkToRegistration"),
  types: text("types").notNull(),
  limitations: text("limitations"),
  p2_types: text("p2_types"),
  p2_startTime: text("p2_startTime"),
  p2_endTime: text("p2_endTime"),
  p2_price: integer("p2_price"),
  p2_total_price: integer("p2_total_price"),
});
