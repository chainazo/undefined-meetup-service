import * as Joi from "joi";
import { Namespace, Router, SwaggerRoute, XRayMiddleware } from "vingle-corgi";

import { routes } from "./routes";

const router = new Router([
  new SwaggerRoute(
    "/swagger",
    {
      title: "MeetupAPI",
      version: "1.0.0",
    },
    routes,
  ),
  new Namespace("", {
    children: routes,
  }),
], {
  middlewares: [],
});

export const handler = router.handler();
