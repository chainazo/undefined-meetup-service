import {
  Middleware,
  Response,
  RoutingContext,
} from "vingle-corgi";

import { generateCORSHeaders } from "../helpers/cors";

export class CORSMiddleware implements Middleware {
  public async after(routingContext: RoutingContext, response: Response): Promise<Response> {
    Object.assign(response.headers, generateCORSHeaders(routingContext));

    return response;
  }
}
