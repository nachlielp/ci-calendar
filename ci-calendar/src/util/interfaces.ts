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
  price: number;
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
