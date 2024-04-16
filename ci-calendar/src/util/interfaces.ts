export enum EventlyType {
  class = "class",
  jam = "jam",
  workshop = "workshop",
  conference = "conference",
}

interface ISubEvent {
  endTime: string;
  type: string;
  startTime: string;
  teacher: string;
  tags: string[];
}
interface IPrice {
  sum: number;
  title: string;
}
interface ILinks {
  link: string;
  title: string;
}
export interface IEvently {
  id: string;
  title: string;
  description: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  owners: string[];
  hide: boolean;
  district: string;
  price: IPrice[];
  links: ILinks[];
  subEvents: ISubEvent[];
}
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
  newsletter: boolean;
  image: string;
  page: string;
  // events: string[];
}
