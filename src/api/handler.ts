import * as Joi from "joi";
import { Namespace, Router, SwaggerRoute } from "vingle-corgi";

import { routes } from "./routes";
import { CORSMiddleware } from "./cors_middleware";

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
  middlewares: [
    // @todo Add XRay Middleware
    new CORSMiddleware(),
  ],
});

export const handler = router.handler();
