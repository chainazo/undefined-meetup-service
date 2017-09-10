import { Decorator, Query, Table } from "dynamo-types";

export enum RESERVATION_STATE {
  WAITING = 0,
  CONFIRMED = 1,
  REJECTED = 2,
}

@Decorator.Table({ name: `undefined_${process.env.ENVIRONMENT}_reservations` })
export class Reservation extends Table {
  @Decorator.FullPrimaryKey("user_id", "meetup_id")
  public static readonly primaryKey: Query.FullPrimaryKey<Reservation, string, string>;

  @Decorator.FullGlobalSecondaryIndex("meetup_id", "user_id")
  public static readonly reversedPrimaryKey: Query.FullGlobalSecondaryIndex<Reservation, string, string>;

  @Decorator.Writer()
  public static readonly writer: Query.Writer<Reservation>;

  public static create(userId: string, meetupId: string) {
    const reservation = new this();

    // just assign instead of using `Object.assign` like features
    // for type checking
    reservation.userId = userId;
    reservation.meetupId = meetupId;
    // @todo separate state to parameters
    reservation.state = RESERVATION_STATE.WAITING;
    reservation.reservedAt = new Date();

    return reservation;
  }

  @Decorator.Attribute({ name: "user_id"})
  public userId: string;

  @Decorator.Attribute({ name: "meetup_id" })
  public meetupId: string;

  @Decorator.Attribute({ name: "state" })
  public state: RESERVATION_STATE;

  public reserved_at: number; // tslint:disable-line

  public get reservedAt() {
    return new Date(this.reserved_at);
  }

  public set reservedAt(date: Date) {
    this.reserved_at = date.getTime();
  }
}
