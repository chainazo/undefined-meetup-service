import * as Joi from "joi";
import { Namespace, Parameter, Route } from "vingle-corgi";
import { exceptionHandler } from "../../helpers/exception_handler";
import { User } from "../../models/user";

export function renderUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    phone: user.phone,
    authenticate_token: user.authenticateToken,
    created_at: user.createdAt,
  };
}

export const route = new Namespace("/users", {
  exceptionHandler,
  children: [
    Route.POST(
      "", "Create new user",
      {
        email: Parameter.Body(Joi.string().email().required()),
        password: Parameter.Body(Joi.string().required()),
        display_name: Parameter.Body(Joi.string().required()),
        phone: Parameter.Body(Joi.string().required()),
      },
      async function() {
        const email = this.params.email as string;
        const password = this.params.password as string;
        const displayName = this.params.display_name as string;
        const phone = this.params.phone as string;

        // @todo Guarantee uniqueness
        const [ record ] = (await User.emailGSI.query(email)).records;

        if (record) {
          return this.json({
            error: {
              message: "Duplicated email address",
            },
          }, 400);
        }

        const user = await User.create({
          email,
          password,
          displayName,
          phone,
        }).save() as User;

        return this.json({
          data: renderUser(user),
        });
      }),
    ],
});
