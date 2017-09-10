import * as Joi from "joi";
import { RoutingContext } from "vingle-corgi";
import { generateCORSHeaders } from "./cors";

export async function exceptionHandler(this: RoutingContext, error: Error) {
  if (error.name === "ValidationError") {
    const validationError = error as Joi.ValidationError;

    return this.json({
      error: {
        name: validationError.name,
        message: validationError.message,
        details: validationError.details,
      },
    }, 400, generateCORSHeaders(this));
  }

  console.error(error.stack); // tslint:disable-line
  return this.json({
    error: {
      id: this.requestId,
      summary: "Ooops something went wrong",
      message: `${error.name} : ${error.message}`,
    },
  }, 500, generateCORSHeaders(this));
}
