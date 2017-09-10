import * as bcrypt from "bcryptjs";
import { Decorator, Query, Table } from "dynamo-types";
import * as uuidv4 from "uuid/v4";

@Decorator.Table({ name: `undefined_${process.env.ENVIRONMENT}_users` })
export class User extends Table {
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<User, string>;

  @Decorator.HashGlobalSecondaryIndex("email")
  public static readonly emailGSI: Query.HashGlobalSecondaryIndex<User, string>;

  @Decorator.HashGlobalSecondaryIndex("authenticate_token")
  public static readonly tokenGSI: Query.HashGlobalSecondaryIndex<User, string>;

  @Decorator.Writer()
  public static readonly writer: Query.Writer<User>;

  public static create(attrs: {
    email: string;
    password: string;
    displayName: string;
    phone: string;
  }) {
    const user = new this();

    // @see meetup.ts
    user.id = uuidv4();
    user.email = attrs.email;
    user.password = attrs.password;
    user.displayName = attrs.displayName;
    user.phone = attrs.phone;
    user.authenticateToken = uuidv4(); // @todo change token to another way
    user.createdAt = new Date();

    return user;
  }

  @Decorator.Attribute()
  public id: string;

  @Decorator.Attribute({ name: "email" })
  public email: string;

  @Decorator.Attribute({ name: "display_name" })
  public displayName: string;

  @Decorator.Attribute({ name: "encrypted_password"})
  public encryptedPassword: string;

  @Decorator.Attribute({ name: "authenticate_token" })
  public authenticateToken: string;

  @Decorator.Attribute({ name: "phone" })
  public phone: string;

  @Decorator.Attribute({ name: "created_at" })
  public created_at: number; // tslint:disable-line

  private readonly BCRYPT_SALT_ROUND = 10;

  public get createdAt() {
    return new Date(this.created_at);
  }

  public set createdAt(date: Date) {
    this.created_at = date.getTime();
  }

  public set password(plaintext: string) {
    this.encryptedPassword = bcrypt.hashSync(plaintext, this.BCRYPT_SALT_ROUND);
  }

  public comparePassword(plaintext: string) {
    return bcrypt.compareSync(plaintext, this.encryptedPassword);
  }
}
