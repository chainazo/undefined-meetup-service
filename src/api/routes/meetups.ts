import * as Joi from "joi";
import * as _ from "lodash";
import { Namespace, Parameter, Route } from "vingle-corgi";
import { exceptionHandler } from "../../helpers/exception_handler";
import { Meetup, MEETUP_APPROVE_TYPE } from "../../models/meetup";
import { Reservation, RESERVATION_STATE } from "../../models/reservation";
import { User } from "../../models/user";

// tslint:disable-next-line
const MOCKED_COVER_IMAGE_URL = "https://scontent-hkg3-1.cdninstagram.com/t51.2885-15/e35/21372489_1542726739104056_5041615435917688832_n.jpg";
const MOCKED_USER_ID = "b27808fe-24fd-4410-a0f9-5d8500c079a2";

function renderCompactUser(user: User) {
  return {
    id: user.id,
    display_name: user.displayName,
    email: user.email,
    phone: user.phone,
  };
}

function renderMeetup(meetup: Meetup, owner: User) {
  return {
    id: meetup.id,
    title: meetup.title,
    owner: renderCompactUser(owner),
    summary: meetup.summary,
    started_at: meetup.startedAt,
    ended_at: meetup.endedAt,
    approve_type: meetup.approveType,
    cover_image_url: meetup.coverImageUrl,
    content: meetup.content,
    location: meetup.location,
    created_at: meetup.createdAt,
  };
}

function renderReservation(reservation: Reservation, user: User) {
  return {
    // should we render meetup information?
    user: renderCompactUser(user),
    state: reservation.state,
  };
}

export const route = new Namespace("/meetups", {
  exceptionHandler,
  children: [
    Route.GET(
    "", "List of meetups",
    {
      // @todo Add status filters (ended, upcoming, etc)
      count: Parameter.Query(Joi.number().optional().default(30)),
      after: Parameter.Query(Joi.string().optional()),
    },
    async function() {
      const count = this.params.count as number;
      const after = this.params.after as string;

      let exclusiveStartKey;

      if (after) {
        try {
          exclusiveStartKey = JSON.parse((new Buffer(after, "base64")).toString("utf8"));
        } catch (e) {
          // invalid payload, ignore it
        }
      }

      const scanResult = await Meetup.primaryKey.scan({
        limit: count,
        exclusiveStartKey,
      });

      // DynamoDB DOES NOT guarantee order of records
      const sortedMeetups = _.sortBy(scanResult.records, (meetup) => -meetup.created_at);

      // Fetch owners
      const ownerIds = _(sortedMeetups).map((meetup) => meetup.ownerId).uniq().value();
      const owners = (await User.primaryKey.batchGet(ownerIds)).records;

      const ownerMap = _.keyBy<User>(owners, (user) =>  user.id);

      return this.json({
        data: sortedMeetups.map((meetup) => renderMeetup(meetup, ownerMap[meetup.ownerId])),
        paging: {
          after: scanResult.lastEvaluatedKey ?
            (new Buffer(JSON.stringify(scanResult.lastEvaluatedKey), "utf8")).toString("base64") : null,
        },
      });
    }),
    Route.POST(
      "", "Create new meetup", {
        title: Parameter.Body(Joi.string().required()),
        summary: Parameter.Body(Joi.string().required()),
        started_at: Parameter.Body(Joi.date().required()),
        ended_at: Parameter.Body(Joi.date().optional()),
        approve_type: Parameter.Body(Joi.allow([
          MEETUP_APPROVE_TYPE.MANUAL,
          MEETUP_APPROVE_TYPE.RANDOM,
          MEETUP_APPROVE_TYPE.RACE,
        ]).optional().default(MEETUP_APPROVE_TYPE.MANUAL)),
        cover_image_url: Parameter.Body(Joi.string().optional().default(MOCKED_COVER_IMAGE_URL)),
        content: Parameter.Body(Joi.string().required()),
        location: Parameter.Body(Joi.string().required()),
    }, async function() {
        const meetup = (await Meetup.create({
          ownerId: MOCKED_USER_ID, // @todo change this to real user
          title: this.params.title,
          summary: this.params.summary,
          startedAt: new Date(this.params.started_at),
          endedAt: this.params.ended_at ? new Date(this.params.ended_at) : undefined,
          approveType: this.params.approve_type as MEETUP_APPROVE_TYPE,
          coverImageUrl: this.params.cover_image_url,
          content: this.params.content,
          location: this.params.location,
        }).save()) as Meetup;

        const owner = await User.primaryKey.get(MOCKED_USER_ID);

        return this.json({
          data: renderMeetup(meetup, owner!),
        });
    }),
    new Namespace("/:meetupId", {
      params: {
        meetupId: Joi.string().guid().required(),
      },
      children: [
        Route.GET("", "Show meetup", {},
          async function() {
          const meetupId = this.params.meetupId as string;

          const meetup = await Meetup.primaryKey.get(meetupId);

          if (!meetup) {
            return this.json({
              error: {
                message: "Couldn't find meetup by given id",
              },
            }, 404);
          }

          const owner = await User.primaryKey.get(meetup.ownerId);

          return this.json({
            data: renderMeetup(meetup, owner!),
          });
        }),
        Route.GET("/attendees", "List attendees of given meetup id", {
          state: Parameter.Query(Joi.allow([
            RESERVATION_STATE.WAITING,
            RESERVATION_STATE.CONFIRMED,
            RESERVATION_STATE.REJECTED,
          ]).optional()),
        }, async function() {
          const meetupId = this.params.meetupId as string;

          const reservations = (await Reservation.reversedPrimaryKey.query({
            hash: meetupId,
          })).records;

          const userReservationMap = _.keyBy<Reservation>(reservations, (reservation) => reservation.userId);

          const users = (await User.primaryKey.batchGet(
            reservations.map((reservation) => reservation.userId),
          )).records;

          return this.json({
            data: users.map((user) => renderReservation(userReservationMap[user.id], user)),
          });
        }),
        Route.POST("/attend", "Attend given meetup", {},
        async function() {
          const meetupId = this.params.meetupId as string;

          // @todo render reservation state of current user
          const reservation = await Reservation.create(MOCKED_USER_ID, meetupId)
            .save() as Reservation;

          return this.json({
            data: {
              user_id: reservation.userId,
              meetup_id: reservation.meetupId,
              state: reservation.state,
            },
          });
        }),
        Route.POST("/approve", "Approve reservation of given user ids", {
          users: Parameter.Body(Joi.array().items(Joi.string().required())),
        }, async function() {
          const meetupId = this.params.meetupId as string;
          const userIds = this.params.users as string[];

          await Promise.all(
            userIds.map((userId) => Reservation.primaryKey.update(userId, meetupId, {
              state: ["PUT", RESERVATION_STATE.CONFIRMED],
            })),
          );

          return this.json({
            // should we return user ids?
            data: userIds,
          });
        }),
      ],
    }),
  ],
});
