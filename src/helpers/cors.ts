import { RoutingContext } from "vingle-corgi";

const { CORS_ALLOWED_ORIGIN } = process.env;

export function generateCORSHeaders(routingContext: RoutingContext) {
  const requestedOrigin = routingContext.headers.origin || "";
  const isAllowedOrigin = requestedOrigin.indexOf(CORS_ALLOWED_ORIGIN) === 0;

  if ((CORS_ALLOWED_ORIGIN && isAllowedOrigin) || !CORS_ALLOWED_ORIGIN) {
    return {
      "Access-Control-Allow-Origin": routingContext.headers.origin,
      "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": routingContext.headers["access-control-request-headers"]
        || "Origin, Content-Type, Accept, Content-Length",
    };
  }

  return {};
}
