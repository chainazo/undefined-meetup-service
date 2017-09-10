import { Namespace, Route, Router, SwaggerRoute } from "vingle-corgi";

import { generateCORSHeaders } from "../helpers/cors";
import { CORSMiddleware } from "./cors_middleware";
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
  Route.OPTIONS("*", "CORS Preflight endpoint", {},
    async function() {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          ...generateCORSHeaders(this),
        },
        body: "",
      };
  }),
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
