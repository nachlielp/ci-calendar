export enum IEventi {
  class = "class",
  jam = "jam",
  workshop = "workshop",
  conference = "conference",
}

interface IEventiPart {
  endTime: string;
  type: string;
  startTime: string;
  //TODO add user option, or just name
  teacher: string;
  tags: string[];
}
interface IPrice {
  sum: number;
  title: string;
}
interface ILink {
  link: string;
  title: string;
}
//TODO preload address and fetch if needed from google api with  id, name, district, lat, lng, address
export interface IAddress {
  place_id: string;
  label: string;
}
export interface IEvently {
  id: string;
  title: string;
  description: string;
  address: IAddress;
  createdAt: string;
  updatedAt: string;
  owners: string[];
  hide: boolean;
  //TODO add loc info to district
  district: string;
  price: IPrice[];
  links: ILink[];
  subEvents: IEventiPart[];
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
  fullName: string;
  phoneNumber: string;
  email: string;
  bio: string;
  subscribedForUpdatesAt: string;
  newsletter: boolean;
  img: string;
  pageUrl: ILink;
}
