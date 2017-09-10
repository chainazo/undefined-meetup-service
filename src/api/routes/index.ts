import { Routes } from "vingle-corgi";
import { route as AuthRoute } from "./auth";
import { route as MeetupRoute } from "./meetups";
import { route as UserRoute } from "./user";

export const routes: Routes = [
  AuthRoute,
  MeetupRoute,
  UserRoute,
];
