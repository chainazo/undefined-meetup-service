import * as Joi from "joi";
import { Namespace, Parameter, Route } from "vingle-corgi";
import { exceptionHandler } from "../../helpers/exception_handler";
import { User } from "../../models/user";
import { renderUser } from "./user";

export const route = new Namespace("/auth", {
  exceptionHandler,
  children: [
    Route.POST(
      "", "Get authenticate token of user that matches given credentials",
      {
        email: Parameter.Body(Joi.string().email().required()),
        password: Parameter.Body(Joi.string().required()),
      },
      async function() {
        const email = this.params.email as string;
        const password = this.params.password as string;

        const [ user ] = (await User.emailGSI.query(email)).records;

        if (!user || !user.comparePassword(password)) {
          return this.json({
            data: {
              message: "Couldn't find user that matches given credentials",
            },
          }, 422);
        }

        return this.json({
          data: renderUser(user),
        });
      }),
  ],
});
