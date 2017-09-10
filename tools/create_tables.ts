// tslint:disable:no-console
import { Meetup } from "../src/models/meetup";
import { Reservation } from "../src/models/reservation";
import { User } from "../src/models/user";

async function main() {
  console.log("creating tables");

  await Promise.all([
    Meetup,
    Reservation,
    User,
  ].map((t) =>
    t.createTable().then(() => console.log(`created ${t.name}`)),
  ));

  console.log("done");
}

main().then().catch(console.error);
