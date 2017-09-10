import { Decorator, Query, Table } from "dynamo-types";
import * as uuidv4 from "uuid/v4";

export enum MEETUP_APPROVE_TYPE {
  MANUAL = 0,
  RANDOM = 1,
  RACE = 2,
}

@Decorator.Table({ name: `undefined_${process.env.ENVIRONMENT}_meetups` })
export class Meetup extends Table {
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<Meetup, string>;

  @Decorator.Writer()
  public static readonly writer: Query.Writer<Meetup>;

  public static create(attrs: {
    title: string;
    ownerId: string;
    summary: string;
    startedAt: Date;
    endedAt?: Date;
    approveType: MEETUP_APPROVE_TYPE;
    coverImageUrl: string;
    content: string;
    location: string;
    // @todo Add maximum attendees
  }) {
    const meetup = new this();

    // DynamoDB doesn't have any AUTO_INCREMENT like features,
    // and sequential partition key is NOT reommended by AWS
    // due to poor performance
    meetup.id = uuidv4();

    // just assign instead of using `Object.assign` like features
    // for type checking
    meetup.title = attrs.title;
    meetup.ownerId = attrs.ownerId;
    meetup.summary = attrs.summary;
    meetup.startedAt = attrs.startedAt;

    if (attrs.endedAt) {
      meetup.endedAt = attrs.endedAt;
    }

    meetup.approveType = attrs.approveType;
    meetup.coverImageUrl = attrs.coverImageUrl;
    meetup.content = attrs.content;
    meetup.location = attrs.location;

    return meetup;
  }

  @Decorator.Attribute()
  public id: string;

  @Decorator.Attribute()
  public title: string;

  @Decorator.Attribute({ name: "owner_id" })
  public ownerId: string;

  @Decorator.Attribute({ name: "summary" })
  public summary: string;

  @Decorator.Attribute({ name: "started_at"})
  public started_at: number; // tslint:disable-line

  @Decorator.Attribute({ name: "ended_at" })
  public ended_at?: number; // tslint:disable-line

  @Decorator.Attribute({ name: "approve_type" })
  public approveType: MEETUP_APPROVE_TYPE;

  @Decorator.Attribute({ name: "cover_image_url" })
  public coverImageUrl: string;

  @Decorator.Attribute()
  public content: string;

  @Decorator.Attribute()
  public location: string;

  @Decorator.Attribute({ name: "created_at"})
  public created_at: number; // tslint:disable-line

  public get startedAt() {
    return new Date(this.started_at);
  }

  public set startedAt(date: Date) {
    this.created_at = date.getTime();
  }

  public get endedAt() {
    if (this.ended_at) {
      return new Date(this.ended_at);
    }

    return undefined;
  }

  public set endedAt(date: Date | undefined) {
    this.ended_at = date ? date.getTime() : undefined;
  }

  public get createdAt() {
    return new Date(this.created_at);
  }

  public set createdAt(date: Date) {
    this.created_at = date.getTime();
  }
}
