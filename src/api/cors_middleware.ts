import {
  Middleware,
  Response,
  RoutingContext,
} from "vingle-corgi";

export class CORSMiddleware implements Middleware {
  constructor(
    private allowedOrigin?: string,
  ) {}

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  public async before(routingContext: RoutingContext): Promise<Response | void> {
    if (routingContext.request.httpMethod.toUpperCase() === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          ...this.generateCORSHeaders(routingContext),
        },
        body: "",
      }
    }
  }

  // runs after the application, should return response
  public async after(routingContext: RoutingContext, response: Response): Promise<Response> {
    if (this.allowedOrigin) {
      const requestedOrigin = routingContext.headers.origin || "";
      const isAllowedOrigin =  requestedOrigin.indexOf(this.allowedOrigin) === 0;

      if (isAllowedOrigin) {
        Object.assign(response.headers, this.generateCORSHeaders(routingContext));
      }
    } else {
      Object.assign(response.headers, this.generateCORSHeaders(routingContext));
    }

    return response;
  }

  private generateCORSHeaders(routingContext: RoutingContext) {
    return {
      "Access-Control-Allow-Origin": routingContext.headers.origin,
      "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": routingContext.headers["access-control-request-headers"]
        || "Origin, Content-Type, Accept, Content-Length",
    };
  }
}
