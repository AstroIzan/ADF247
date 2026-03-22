
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Role
 * 
 */
export type Role = $Result.DefaultSelection<Prisma.$RolePayload>
/**
 * Model ConvoType
 * 
 */
export type ConvoType = $Result.DefaultSelection<Prisma.$ConvoTypePayload>
/**
 * Model Convocatoria
 * 
 */
export type Convocatoria = $Result.DefaultSelection<Prisma.$ConvocatoriaPayload>
/**
 * Model Respuesta
 * 
 */
export type Respuesta = $Result.DefaultSelection<Prisma.$RespuestaPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.role`: Exposes CRUD operations for the **Role** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Roles
    * const roles = await prisma.role.findMany()
    * ```
    */
  get role(): Prisma.RoleDelegate<ExtArgs>;

  /**
   * `prisma.convoType`: Exposes CRUD operations for the **ConvoType** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConvoTypes
    * const convoTypes = await prisma.convoType.findMany()
    * ```
    */
  get convoType(): Prisma.ConvoTypeDelegate<ExtArgs>;

  /**
   * `prisma.convocatoria`: Exposes CRUD operations for the **Convocatoria** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Convocatorias
    * const convocatorias = await prisma.convocatoria.findMany()
    * ```
    */
  get convocatoria(): Prisma.ConvocatoriaDelegate<ExtArgs>;

  /**
   * `prisma.respuesta`: Exposes CRUD operations for the **Respuesta** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Respuestas
    * const respuestas = await prisma.respuesta.findMany()
    * ```
    */
  get respuesta(): Prisma.RespuestaDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Role: 'Role',
    ConvoType: 'ConvoType',
    Convocatoria: 'Convocatoria',
    Respuesta: 'Respuesta'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "role" | "convoType" | "convocatoria" | "respuesta"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Role: {
        payload: Prisma.$RolePayload<ExtArgs>
        fields: Prisma.RoleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          findFirst: {
            args: Prisma.RoleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          findMany: {
            args: Prisma.RoleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>[]
          }
          create: {
            args: Prisma.RoleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          createMany: {
            args: Prisma.RoleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>[]
          }
          delete: {
            args: Prisma.RoleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          update: {
            args: Prisma.RoleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          deleteMany: {
            args: Prisma.RoleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RoleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RolePayload>
          }
          aggregate: {
            args: Prisma.RoleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRole>
          }
          groupBy: {
            args: Prisma.RoleGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoleGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoleCountArgs<ExtArgs>
            result: $Utils.Optional<RoleCountAggregateOutputType> | number
          }
        }
      }
      ConvoType: {
        payload: Prisma.$ConvoTypePayload<ExtArgs>
        fields: Prisma.ConvoTypeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConvoTypeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConvoTypeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          findFirst: {
            args: Prisma.ConvoTypeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConvoTypeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          findMany: {
            args: Prisma.ConvoTypeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>[]
          }
          create: {
            args: Prisma.ConvoTypeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          createMany: {
            args: Prisma.ConvoTypeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConvoTypeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>[]
          }
          delete: {
            args: Prisma.ConvoTypeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          update: {
            args: Prisma.ConvoTypeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          deleteMany: {
            args: Prisma.ConvoTypeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConvoTypeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConvoTypeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvoTypePayload>
          }
          aggregate: {
            args: Prisma.ConvoTypeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConvoType>
          }
          groupBy: {
            args: Prisma.ConvoTypeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConvoTypeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConvoTypeCountArgs<ExtArgs>
            result: $Utils.Optional<ConvoTypeCountAggregateOutputType> | number
          }
        }
      }
      Convocatoria: {
        payload: Prisma.$ConvocatoriaPayload<ExtArgs>
        fields: Prisma.ConvocatoriaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConvocatoriaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConvocatoriaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          findFirst: {
            args: Prisma.ConvocatoriaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConvocatoriaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          findMany: {
            args: Prisma.ConvocatoriaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>[]
          }
          create: {
            args: Prisma.ConvocatoriaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          createMany: {
            args: Prisma.ConvocatoriaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConvocatoriaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>[]
          }
          delete: {
            args: Prisma.ConvocatoriaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          update: {
            args: Prisma.ConvocatoriaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          deleteMany: {
            args: Prisma.ConvocatoriaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConvocatoriaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ConvocatoriaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConvocatoriaPayload>
          }
          aggregate: {
            args: Prisma.ConvocatoriaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConvocatoria>
          }
          groupBy: {
            args: Prisma.ConvocatoriaGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConvocatoriaGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConvocatoriaCountArgs<ExtArgs>
            result: $Utils.Optional<ConvocatoriaCountAggregateOutputType> | number
          }
        }
      }
      Respuesta: {
        payload: Prisma.$RespuestaPayload<ExtArgs>
        fields: Prisma.RespuestaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RespuestaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RespuestaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          findFirst: {
            args: Prisma.RespuestaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RespuestaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          findMany: {
            args: Prisma.RespuestaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>[]
          }
          create: {
            args: Prisma.RespuestaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          createMany: {
            args: Prisma.RespuestaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RespuestaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>[]
          }
          delete: {
            args: Prisma.RespuestaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          update: {
            args: Prisma.RespuestaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          deleteMany: {
            args: Prisma.RespuestaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RespuestaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RespuestaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RespuestaPayload>
          }
          aggregate: {
            args: Prisma.RespuestaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRespuesta>
          }
          groupBy: {
            args: Prisma.RespuestaGroupByArgs<ExtArgs>
            result: $Utils.Optional<RespuestaGroupByOutputType>[]
          }
          count: {
            args: Prisma.RespuestaCountArgs<ExtArgs>
            result: $Utils.Optional<RespuestaCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    roles: number
    convocatories: number
    respostas: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | UserCountOutputTypeCountRolesArgs
    convocatories?: boolean | UserCountOutputTypeCountConvocatoriesArgs
    respostas?: boolean | UserCountOutputTypeCountRespostasArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountConvocatoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConvocatoriaWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRespostasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RespuestaWhereInput
  }


  /**
   * Count Type ConvoTypeCountOutputType
   */

  export type ConvoTypeCountOutputType = {
    convocatories: number
  }

  export type ConvoTypeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    convocatories?: boolean | ConvoTypeCountOutputTypeCountConvocatoriesArgs
  }

  // Custom InputTypes
  /**
   * ConvoTypeCountOutputType without action
   */
  export type ConvoTypeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoTypeCountOutputType
     */
    select?: ConvoTypeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConvoTypeCountOutputType without action
   */
  export type ConvoTypeCountOutputTypeCountConvocatoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConvocatoriaWhereInput
  }


  /**
   * Count Type ConvocatoriaCountOutputType
   */

  export type ConvocatoriaCountOutputType = {
    respostas: number
  }

  export type ConvocatoriaCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    respostas?: boolean | ConvocatoriaCountOutputTypeCountRespostasArgs
  }

  // Custom InputTypes
  /**
   * ConvocatoriaCountOutputType without action
   */
  export type ConvocatoriaCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvocatoriaCountOutputType
     */
    select?: ConvocatoriaCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ConvocatoriaCountOutputType without action
   */
  export type ConvocatoriaCountOutputTypeCountRespostasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RespuestaWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    nCarnet: string | null
    nIndicatiu: string | null
    name: string | null
    lastName: string | null
    password: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    nCarnet: string | null
    nIndicatiu: string | null
    name: string | null
    lastName: string | null
    password: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    nCarnet: number
    nIndicatiu: number
    name: number
    lastName: number
    password: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    nCarnet?: true
    nIndicatiu?: true
    name?: true
    lastName?: true
    password?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    nCarnet?: true
    nIndicatiu?: true
    name?: true
    lastName?: true
    password?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    nCarnet?: true
    nIndicatiu?: true
    name?: true
    lastName?: true
    password?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    nCarnet: string
    nIndicatiu: string | null
    name: string
    lastName: string | null
    password: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nCarnet?: boolean
    nIndicatiu?: boolean
    name?: boolean
    lastName?: boolean
    password?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    roles?: boolean | User$rolesArgs<ExtArgs>
    convocatories?: boolean | User$convocatoriesArgs<ExtArgs>
    respostas?: boolean | User$respostasArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nCarnet?: boolean
    nIndicatiu?: boolean
    name?: boolean
    lastName?: boolean
    password?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    nCarnet?: boolean
    nIndicatiu?: boolean
    name?: boolean
    lastName?: boolean
    password?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    roles?: boolean | User$rolesArgs<ExtArgs>
    convocatories?: boolean | User$convocatoriesArgs<ExtArgs>
    respostas?: boolean | User$respostasArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      roles: Prisma.$RolePayload<ExtArgs>[]
      convocatories: Prisma.$ConvocatoriaPayload<ExtArgs>[]
      respostas: Prisma.$RespuestaPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nCarnet: string
      nIndicatiu: string | null
      name: string
      lastName: string | null
      password: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    roles<T extends User$rolesArgs<ExtArgs> = {}>(args?: Subset<T, User$rolesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findMany"> | Null>
    convocatories<T extends User$convocatoriesArgs<ExtArgs> = {}>(args?: Subset<T, User$convocatoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findMany"> | Null>
    respostas<T extends User$respostasArgs<ExtArgs> = {}>(args?: Subset<T, User$respostasArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly nCarnet: FieldRef<"User", 'String'>
    readonly nIndicatiu: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly isActive: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.roles
   */
  export type User$rolesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    where?: RoleWhereInput
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    cursor?: RoleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * User.convocatories
   */
  export type User$convocatoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    where?: ConvocatoriaWhereInput
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    cursor?: ConvocatoriaWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConvocatoriaScalarFieldEnum | ConvocatoriaScalarFieldEnum[]
  }

  /**
   * User.respostas
   */
  export type User$respostasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    where?: RespuestaWhereInput
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    cursor?: RespuestaWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RespuestaScalarFieldEnum | RespuestaScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Role
   */

  export type AggregateRole = {
    _count: RoleCountAggregateOutputType | null
    _avg: RoleAvgAggregateOutputType | null
    _sum: RoleSumAggregateOutputType | null
    _min: RoleMinAggregateOutputType | null
    _max: RoleMaxAggregateOutputType | null
  }

  export type RoleAvgAggregateOutputType = {
    id: number | null
  }

  export type RoleSumAggregateOutputType = {
    id: number | null
  }

  export type RoleMinAggregateOutputType = {
    id: number | null
    nCarnet: string | null
    isCapOperatiu: boolean | null
    isCapColla: boolean | null
    isAdmin: boolean | null
    isGroc: boolean | null
  }

  export type RoleMaxAggregateOutputType = {
    id: number | null
    nCarnet: string | null
    isCapOperatiu: boolean | null
    isCapColla: boolean | null
    isAdmin: boolean | null
    isGroc: boolean | null
  }

  export type RoleCountAggregateOutputType = {
    id: number
    nCarnet: number
    isCapOperatiu: number
    isCapColla: number
    isAdmin: number
    isGroc: number
    _all: number
  }


  export type RoleAvgAggregateInputType = {
    id?: true
  }

  export type RoleSumAggregateInputType = {
    id?: true
  }

  export type RoleMinAggregateInputType = {
    id?: true
    nCarnet?: true
    isCapOperatiu?: true
    isCapColla?: true
    isAdmin?: true
    isGroc?: true
  }

  export type RoleMaxAggregateInputType = {
    id?: true
    nCarnet?: true
    isCapOperatiu?: true
    isCapColla?: true
    isAdmin?: true
    isGroc?: true
  }

  export type RoleCountAggregateInputType = {
    id?: true
    nCarnet?: true
    isCapOperatiu?: true
    isCapColla?: true
    isAdmin?: true
    isGroc?: true
    _all?: true
  }

  export type RoleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Role to aggregate.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Roles
    **/
    _count?: true | RoleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RoleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RoleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RoleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RoleMaxAggregateInputType
  }

  export type GetRoleAggregateType<T extends RoleAggregateArgs> = {
        [P in keyof T & keyof AggregateRole]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRole[P]>
      : GetScalarType<T[P], AggregateRole[P]>
  }




  export type RoleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleWhereInput
    orderBy?: RoleOrderByWithAggregationInput | RoleOrderByWithAggregationInput[]
    by: RoleScalarFieldEnum[] | RoleScalarFieldEnum
    having?: RoleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoleCountAggregateInputType | true
    _avg?: RoleAvgAggregateInputType
    _sum?: RoleSumAggregateInputType
    _min?: RoleMinAggregateInputType
    _max?: RoleMaxAggregateInputType
  }

  export type RoleGroupByOutputType = {
    id: number
    nCarnet: string
    isCapOperatiu: boolean
    isCapColla: boolean
    isAdmin: boolean
    isGroc: boolean
    _count: RoleCountAggregateOutputType | null
    _avg: RoleAvgAggregateOutputType | null
    _sum: RoleSumAggregateOutputType | null
    _min: RoleMinAggregateOutputType | null
    _max: RoleMaxAggregateOutputType | null
  }

  type GetRoleGroupByPayload<T extends RoleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoleGroupByOutputType[P]>
            : GetScalarType<T[P], RoleGroupByOutputType[P]>
        }
      >
    >


  export type RoleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nCarnet?: boolean
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["role"]>

  export type RoleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nCarnet?: boolean
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["role"]>

  export type RoleSelectScalar = {
    id?: boolean
    nCarnet?: boolean
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type RoleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Role"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nCarnet: string
      isCapOperatiu: boolean
      isCapColla: boolean
      isAdmin: boolean
      isGroc: boolean
    }, ExtArgs["result"]["role"]>
    composites: {}
  }

  type RoleGetPayload<S extends boolean | null | undefined | RoleDefaultArgs> = $Result.GetResult<Prisma.$RolePayload, S>

  type RoleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RoleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RoleCountAggregateInputType | true
    }

  export interface RoleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Role'], meta: { name: 'Role' } }
    /**
     * Find zero or one Role that matches the filter.
     * @param {RoleFindUniqueArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoleFindUniqueArgs>(args: SelectSubset<T, RoleFindUniqueArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Role that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RoleFindUniqueOrThrowArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoleFindUniqueOrThrowArgs>(args: SelectSubset<T, RoleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Role that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindFirstArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoleFindFirstArgs>(args?: SelectSubset<T, RoleFindFirstArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Role that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindFirstOrThrowArgs} args - Arguments to find a Role
     * @example
     * // Get one Role
     * const role = await prisma.role.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoleFindFirstOrThrowArgs>(args?: SelectSubset<T, RoleFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Roles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Roles
     * const roles = await prisma.role.findMany()
     * 
     * // Get first 10 Roles
     * const roles = await prisma.role.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const roleWithIdOnly = await prisma.role.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RoleFindManyArgs>(args?: SelectSubset<T, RoleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Role.
     * @param {RoleCreateArgs} args - Arguments to create a Role.
     * @example
     * // Create one Role
     * const Role = await prisma.role.create({
     *   data: {
     *     // ... data to create a Role
     *   }
     * })
     * 
     */
    create<T extends RoleCreateArgs>(args: SelectSubset<T, RoleCreateArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Roles.
     * @param {RoleCreateManyArgs} args - Arguments to create many Roles.
     * @example
     * // Create many Roles
     * const role = await prisma.role.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RoleCreateManyArgs>(args?: SelectSubset<T, RoleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Roles and returns the data saved in the database.
     * @param {RoleCreateManyAndReturnArgs} args - Arguments to create many Roles.
     * @example
     * // Create many Roles
     * const role = await prisma.role.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Roles and only return the `id`
     * const roleWithIdOnly = await prisma.role.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RoleCreateManyAndReturnArgs>(args?: SelectSubset<T, RoleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Role.
     * @param {RoleDeleteArgs} args - Arguments to delete one Role.
     * @example
     * // Delete one Role
     * const Role = await prisma.role.delete({
     *   where: {
     *     // ... filter to delete one Role
     *   }
     * })
     * 
     */
    delete<T extends RoleDeleteArgs>(args: SelectSubset<T, RoleDeleteArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Role.
     * @param {RoleUpdateArgs} args - Arguments to update one Role.
     * @example
     * // Update one Role
     * const role = await prisma.role.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RoleUpdateArgs>(args: SelectSubset<T, RoleUpdateArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Roles.
     * @param {RoleDeleteManyArgs} args - Arguments to filter Roles to delete.
     * @example
     * // Delete a few Roles
     * const { count } = await prisma.role.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RoleDeleteManyArgs>(args?: SelectSubset<T, RoleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Roles
     * const role = await prisma.role.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RoleUpdateManyArgs>(args: SelectSubset<T, RoleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Role.
     * @param {RoleUpsertArgs} args - Arguments to update or create a Role.
     * @example
     * // Update or create a Role
     * const role = await prisma.role.upsert({
     *   create: {
     *     // ... data to create a Role
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Role we want to update
     *   }
     * })
     */
    upsert<T extends RoleUpsertArgs>(args: SelectSubset<T, RoleUpsertArgs<ExtArgs>>): Prisma__RoleClient<$Result.GetResult<Prisma.$RolePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleCountArgs} args - Arguments to filter Roles to count.
     * @example
     * // Count the number of Roles
     * const count = await prisma.role.count({
     *   where: {
     *     // ... the filter for the Roles we want to count
     *   }
     * })
    **/
    count<T extends RoleCountArgs>(
      args?: Subset<T, RoleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoleAggregateArgs>(args: Subset<T, RoleAggregateArgs>): Prisma.PrismaPromise<GetRoleAggregateType<T>>

    /**
     * Group by Role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RoleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoleGroupByArgs['orderBy'] }
        : { orderBy?: RoleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Role model
   */
  readonly fields: RoleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Role.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Role model
   */ 
  interface RoleFieldRefs {
    readonly id: FieldRef<"Role", 'Int'>
    readonly nCarnet: FieldRef<"Role", 'String'>
    readonly isCapOperatiu: FieldRef<"Role", 'Boolean'>
    readonly isCapColla: FieldRef<"Role", 'Boolean'>
    readonly isAdmin: FieldRef<"Role", 'Boolean'>
    readonly isGroc: FieldRef<"Role", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Role findUnique
   */
  export type RoleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role findUniqueOrThrow
   */
  export type RoleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role findFirst
   */
  export type RoleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Roles.
     */
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role findFirstOrThrow
   */
  export type RoleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Role to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Roles.
     */
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role findMany
   */
  export type RoleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter, which Roles to fetch.
     */
    where?: RoleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Roles to fetch.
     */
    orderBy?: RoleOrderByWithRelationInput | RoleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Roles.
     */
    cursor?: RoleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Roles.
     */
    skip?: number
    distinct?: RoleScalarFieldEnum | RoleScalarFieldEnum[]
  }

  /**
   * Role create
   */
  export type RoleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The data needed to create a Role.
     */
    data: XOR<RoleCreateInput, RoleUncheckedCreateInput>
  }

  /**
   * Role createMany
   */
  export type RoleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Roles.
     */
    data: RoleCreateManyInput | RoleCreateManyInput[]
  }

  /**
   * Role createManyAndReturn
   */
  export type RoleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Roles.
     */
    data: RoleCreateManyInput | RoleCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Role update
   */
  export type RoleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The data needed to update a Role.
     */
    data: XOR<RoleUpdateInput, RoleUncheckedUpdateInput>
    /**
     * Choose, which Role to update.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role updateMany
   */
  export type RoleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Roles.
     */
    data: XOR<RoleUpdateManyMutationInput, RoleUncheckedUpdateManyInput>
    /**
     * Filter which Roles to update
     */
    where?: RoleWhereInput
  }

  /**
   * Role upsert
   */
  export type RoleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * The filter to search for the Role to update in case it exists.
     */
    where: RoleWhereUniqueInput
    /**
     * In case the Role found by the `where` argument doesn't exist, create a new Role with this data.
     */
    create: XOR<RoleCreateInput, RoleUncheckedCreateInput>
    /**
     * In case the Role was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoleUpdateInput, RoleUncheckedUpdateInput>
  }

  /**
   * Role delete
   */
  export type RoleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
    /**
     * Filter which Role to delete.
     */
    where: RoleWhereUniqueInput
  }

  /**
   * Role deleteMany
   */
  export type RoleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Roles to delete
     */
    where?: RoleWhereInput
  }

  /**
   * Role without action
   */
  export type RoleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Role
     */
    select?: RoleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleInclude<ExtArgs> | null
  }


  /**
   * Model ConvoType
   */

  export type AggregateConvoType = {
    _count: ConvoTypeCountAggregateOutputType | null
    _avg: ConvoTypeAvgAggregateOutputType | null
    _sum: ConvoTypeSumAggregateOutputType | null
    _min: ConvoTypeMinAggregateOutputType | null
    _max: ConvoTypeMaxAggregateOutputType | null
  }

  export type ConvoTypeAvgAggregateOutputType = {
    id: number | null
    minGrocSortida: number | null
    minVerdSortida: number | null
  }

  export type ConvoTypeSumAggregateOutputType = {
    id: number | null
    minGrocSortida: number | null
    minVerdSortida: number | null
  }

  export type ConvoTypeMinAggregateOutputType = {
    id: number | null
    name: string | null
    minGrocSortida: number | null
    minVerdSortida: number | null
    defaultLocation: string | null
  }

  export type ConvoTypeMaxAggregateOutputType = {
    id: number | null
    name: string | null
    minGrocSortida: number | null
    minVerdSortida: number | null
    defaultLocation: string | null
  }

  export type ConvoTypeCountAggregateOutputType = {
    id: number
    name: number
    minGrocSortida: number
    minVerdSortida: number
    defaultLocation: number
    _all: number
  }


  export type ConvoTypeAvgAggregateInputType = {
    id?: true
    minGrocSortida?: true
    minVerdSortida?: true
  }

  export type ConvoTypeSumAggregateInputType = {
    id?: true
    minGrocSortida?: true
    minVerdSortida?: true
  }

  export type ConvoTypeMinAggregateInputType = {
    id?: true
    name?: true
    minGrocSortida?: true
    minVerdSortida?: true
    defaultLocation?: true
  }

  export type ConvoTypeMaxAggregateInputType = {
    id?: true
    name?: true
    minGrocSortida?: true
    minVerdSortida?: true
    defaultLocation?: true
  }

  export type ConvoTypeCountAggregateInputType = {
    id?: true
    name?: true
    minGrocSortida?: true
    minVerdSortida?: true
    defaultLocation?: true
    _all?: true
  }

  export type ConvoTypeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConvoType to aggregate.
     */
    where?: ConvoTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConvoTypes to fetch.
     */
    orderBy?: ConvoTypeOrderByWithRelationInput | ConvoTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConvoTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConvoTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConvoTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ConvoTypes
    **/
    _count?: true | ConvoTypeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConvoTypeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConvoTypeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConvoTypeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConvoTypeMaxAggregateInputType
  }

  export type GetConvoTypeAggregateType<T extends ConvoTypeAggregateArgs> = {
        [P in keyof T & keyof AggregateConvoType]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConvoType[P]>
      : GetScalarType<T[P], AggregateConvoType[P]>
  }




  export type ConvoTypeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConvoTypeWhereInput
    orderBy?: ConvoTypeOrderByWithAggregationInput | ConvoTypeOrderByWithAggregationInput[]
    by: ConvoTypeScalarFieldEnum[] | ConvoTypeScalarFieldEnum
    having?: ConvoTypeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConvoTypeCountAggregateInputType | true
    _avg?: ConvoTypeAvgAggregateInputType
    _sum?: ConvoTypeSumAggregateInputType
    _min?: ConvoTypeMinAggregateInputType
    _max?: ConvoTypeMaxAggregateInputType
  }

  export type ConvoTypeGroupByOutputType = {
    id: number
    name: string
    minGrocSortida: number
    minVerdSortida: number
    defaultLocation: string | null
    _count: ConvoTypeCountAggregateOutputType | null
    _avg: ConvoTypeAvgAggregateOutputType | null
    _sum: ConvoTypeSumAggregateOutputType | null
    _min: ConvoTypeMinAggregateOutputType | null
    _max: ConvoTypeMaxAggregateOutputType | null
  }

  type GetConvoTypeGroupByPayload<T extends ConvoTypeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConvoTypeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConvoTypeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConvoTypeGroupByOutputType[P]>
            : GetScalarType<T[P], ConvoTypeGroupByOutputType[P]>
        }
      >
    >


  export type ConvoTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    minGrocSortida?: boolean
    minVerdSortida?: boolean
    defaultLocation?: boolean
    convocatories?: boolean | ConvoType$convocatoriesArgs<ExtArgs>
    _count?: boolean | ConvoTypeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["convoType"]>

  export type ConvoTypeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    minGrocSortida?: boolean
    minVerdSortida?: boolean
    defaultLocation?: boolean
  }, ExtArgs["result"]["convoType"]>

  export type ConvoTypeSelectScalar = {
    id?: boolean
    name?: boolean
    minGrocSortida?: boolean
    minVerdSortida?: boolean
    defaultLocation?: boolean
  }

  export type ConvoTypeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    convocatories?: boolean | ConvoType$convocatoriesArgs<ExtArgs>
    _count?: boolean | ConvoTypeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConvoTypeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ConvoTypePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConvoType"
    objects: {
      convocatories: Prisma.$ConvocatoriaPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      minGrocSortida: number
      minVerdSortida: number
      defaultLocation: string | null
    }, ExtArgs["result"]["convoType"]>
    composites: {}
  }

  type ConvoTypeGetPayload<S extends boolean | null | undefined | ConvoTypeDefaultArgs> = $Result.GetResult<Prisma.$ConvoTypePayload, S>

  type ConvoTypeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ConvoTypeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ConvoTypeCountAggregateInputType | true
    }

  export interface ConvoTypeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConvoType'], meta: { name: 'ConvoType' } }
    /**
     * Find zero or one ConvoType that matches the filter.
     * @param {ConvoTypeFindUniqueArgs} args - Arguments to find a ConvoType
     * @example
     * // Get one ConvoType
     * const convoType = await prisma.convoType.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConvoTypeFindUniqueArgs>(args: SelectSubset<T, ConvoTypeFindUniqueArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ConvoType that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ConvoTypeFindUniqueOrThrowArgs} args - Arguments to find a ConvoType
     * @example
     * // Get one ConvoType
     * const convoType = await prisma.convoType.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConvoTypeFindUniqueOrThrowArgs>(args: SelectSubset<T, ConvoTypeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ConvoType that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeFindFirstArgs} args - Arguments to find a ConvoType
     * @example
     * // Get one ConvoType
     * const convoType = await prisma.convoType.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConvoTypeFindFirstArgs>(args?: SelectSubset<T, ConvoTypeFindFirstArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ConvoType that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeFindFirstOrThrowArgs} args - Arguments to find a ConvoType
     * @example
     * // Get one ConvoType
     * const convoType = await prisma.convoType.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConvoTypeFindFirstOrThrowArgs>(args?: SelectSubset<T, ConvoTypeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ConvoTypes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConvoTypes
     * const convoTypes = await prisma.convoType.findMany()
     * 
     * // Get first 10 ConvoTypes
     * const convoTypes = await prisma.convoType.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const convoTypeWithIdOnly = await prisma.convoType.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConvoTypeFindManyArgs>(args?: SelectSubset<T, ConvoTypeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ConvoType.
     * @param {ConvoTypeCreateArgs} args - Arguments to create a ConvoType.
     * @example
     * // Create one ConvoType
     * const ConvoType = await prisma.convoType.create({
     *   data: {
     *     // ... data to create a ConvoType
     *   }
     * })
     * 
     */
    create<T extends ConvoTypeCreateArgs>(args: SelectSubset<T, ConvoTypeCreateArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ConvoTypes.
     * @param {ConvoTypeCreateManyArgs} args - Arguments to create many ConvoTypes.
     * @example
     * // Create many ConvoTypes
     * const convoType = await prisma.convoType.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConvoTypeCreateManyArgs>(args?: SelectSubset<T, ConvoTypeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConvoTypes and returns the data saved in the database.
     * @param {ConvoTypeCreateManyAndReturnArgs} args - Arguments to create many ConvoTypes.
     * @example
     * // Create many ConvoTypes
     * const convoType = await prisma.convoType.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ConvoTypes and only return the `id`
     * const convoTypeWithIdOnly = await prisma.convoType.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConvoTypeCreateManyAndReturnArgs>(args?: SelectSubset<T, ConvoTypeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ConvoType.
     * @param {ConvoTypeDeleteArgs} args - Arguments to delete one ConvoType.
     * @example
     * // Delete one ConvoType
     * const ConvoType = await prisma.convoType.delete({
     *   where: {
     *     // ... filter to delete one ConvoType
     *   }
     * })
     * 
     */
    delete<T extends ConvoTypeDeleteArgs>(args: SelectSubset<T, ConvoTypeDeleteArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ConvoType.
     * @param {ConvoTypeUpdateArgs} args - Arguments to update one ConvoType.
     * @example
     * // Update one ConvoType
     * const convoType = await prisma.convoType.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConvoTypeUpdateArgs>(args: SelectSubset<T, ConvoTypeUpdateArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ConvoTypes.
     * @param {ConvoTypeDeleteManyArgs} args - Arguments to filter ConvoTypes to delete.
     * @example
     * // Delete a few ConvoTypes
     * const { count } = await prisma.convoType.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConvoTypeDeleteManyArgs>(args?: SelectSubset<T, ConvoTypeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConvoTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConvoTypes
     * const convoType = await prisma.convoType.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConvoTypeUpdateManyArgs>(args: SelectSubset<T, ConvoTypeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ConvoType.
     * @param {ConvoTypeUpsertArgs} args - Arguments to update or create a ConvoType.
     * @example
     * // Update or create a ConvoType
     * const convoType = await prisma.convoType.upsert({
     *   create: {
     *     // ... data to create a ConvoType
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConvoType we want to update
     *   }
     * })
     */
    upsert<T extends ConvoTypeUpsertArgs>(args: SelectSubset<T, ConvoTypeUpsertArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ConvoTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeCountArgs} args - Arguments to filter ConvoTypes to count.
     * @example
     * // Count the number of ConvoTypes
     * const count = await prisma.convoType.count({
     *   where: {
     *     // ... the filter for the ConvoTypes we want to count
     *   }
     * })
    **/
    count<T extends ConvoTypeCountArgs>(
      args?: Subset<T, ConvoTypeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConvoTypeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConvoType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConvoTypeAggregateArgs>(args: Subset<T, ConvoTypeAggregateArgs>): Prisma.PrismaPromise<GetConvoTypeAggregateType<T>>

    /**
     * Group by ConvoType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvoTypeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConvoTypeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConvoTypeGroupByArgs['orderBy'] }
        : { orderBy?: ConvoTypeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConvoTypeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConvoTypeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConvoType model
   */
  readonly fields: ConvoTypeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConvoType.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConvoTypeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    convocatories<T extends ConvoType$convocatoriesArgs<ExtArgs> = {}>(args?: Subset<T, ConvoType$convocatoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ConvoType model
   */ 
  interface ConvoTypeFieldRefs {
    readonly id: FieldRef<"ConvoType", 'Int'>
    readonly name: FieldRef<"ConvoType", 'String'>
    readonly minGrocSortida: FieldRef<"ConvoType", 'Int'>
    readonly minVerdSortida: FieldRef<"ConvoType", 'Int'>
    readonly defaultLocation: FieldRef<"ConvoType", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ConvoType findUnique
   */
  export type ConvoTypeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter, which ConvoType to fetch.
     */
    where: ConvoTypeWhereUniqueInput
  }

  /**
   * ConvoType findUniqueOrThrow
   */
  export type ConvoTypeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter, which ConvoType to fetch.
     */
    where: ConvoTypeWhereUniqueInput
  }

  /**
   * ConvoType findFirst
   */
  export type ConvoTypeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter, which ConvoType to fetch.
     */
    where?: ConvoTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConvoTypes to fetch.
     */
    orderBy?: ConvoTypeOrderByWithRelationInput | ConvoTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConvoTypes.
     */
    cursor?: ConvoTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConvoTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConvoTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConvoTypes.
     */
    distinct?: ConvoTypeScalarFieldEnum | ConvoTypeScalarFieldEnum[]
  }

  /**
   * ConvoType findFirstOrThrow
   */
  export type ConvoTypeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter, which ConvoType to fetch.
     */
    where?: ConvoTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConvoTypes to fetch.
     */
    orderBy?: ConvoTypeOrderByWithRelationInput | ConvoTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ConvoTypes.
     */
    cursor?: ConvoTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConvoTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConvoTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ConvoTypes.
     */
    distinct?: ConvoTypeScalarFieldEnum | ConvoTypeScalarFieldEnum[]
  }

  /**
   * ConvoType findMany
   */
  export type ConvoTypeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter, which ConvoTypes to fetch.
     */
    where?: ConvoTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ConvoTypes to fetch.
     */
    orderBy?: ConvoTypeOrderByWithRelationInput | ConvoTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ConvoTypes.
     */
    cursor?: ConvoTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ConvoTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ConvoTypes.
     */
    skip?: number
    distinct?: ConvoTypeScalarFieldEnum | ConvoTypeScalarFieldEnum[]
  }

  /**
   * ConvoType create
   */
  export type ConvoTypeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * The data needed to create a ConvoType.
     */
    data: XOR<ConvoTypeCreateInput, ConvoTypeUncheckedCreateInput>
  }

  /**
   * ConvoType createMany
   */
  export type ConvoTypeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConvoTypes.
     */
    data: ConvoTypeCreateManyInput | ConvoTypeCreateManyInput[]
  }

  /**
   * ConvoType createManyAndReturn
   */
  export type ConvoTypeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ConvoTypes.
     */
    data: ConvoTypeCreateManyInput | ConvoTypeCreateManyInput[]
  }

  /**
   * ConvoType update
   */
  export type ConvoTypeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * The data needed to update a ConvoType.
     */
    data: XOR<ConvoTypeUpdateInput, ConvoTypeUncheckedUpdateInput>
    /**
     * Choose, which ConvoType to update.
     */
    where: ConvoTypeWhereUniqueInput
  }

  /**
   * ConvoType updateMany
   */
  export type ConvoTypeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConvoTypes.
     */
    data: XOR<ConvoTypeUpdateManyMutationInput, ConvoTypeUncheckedUpdateManyInput>
    /**
     * Filter which ConvoTypes to update
     */
    where?: ConvoTypeWhereInput
  }

  /**
   * ConvoType upsert
   */
  export type ConvoTypeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * The filter to search for the ConvoType to update in case it exists.
     */
    where: ConvoTypeWhereUniqueInput
    /**
     * In case the ConvoType found by the `where` argument doesn't exist, create a new ConvoType with this data.
     */
    create: XOR<ConvoTypeCreateInput, ConvoTypeUncheckedCreateInput>
    /**
     * In case the ConvoType was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConvoTypeUpdateInput, ConvoTypeUncheckedUpdateInput>
  }

  /**
   * ConvoType delete
   */
  export type ConvoTypeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
    /**
     * Filter which ConvoType to delete.
     */
    where: ConvoTypeWhereUniqueInput
  }

  /**
   * ConvoType deleteMany
   */
  export type ConvoTypeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConvoTypes to delete
     */
    where?: ConvoTypeWhereInput
  }

  /**
   * ConvoType.convocatories
   */
  export type ConvoType$convocatoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    where?: ConvocatoriaWhereInput
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    cursor?: ConvocatoriaWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConvocatoriaScalarFieldEnum | ConvocatoriaScalarFieldEnum[]
  }

  /**
   * ConvoType without action
   */
  export type ConvoTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConvoType
     */
    select?: ConvoTypeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvoTypeInclude<ExtArgs> | null
  }


  /**
   * Model Convocatoria
   */

  export type AggregateConvocatoria = {
    _count: ConvocatoriaCountAggregateOutputType | null
    _avg: ConvocatoriaAvgAggregateOutputType | null
    _sum: ConvocatoriaSumAggregateOutputType | null
    _min: ConvocatoriaMinAggregateOutputType | null
    _max: ConvocatoriaMaxAggregateOutputType | null
  }

  export type ConvocatoriaAvgAggregateOutputType = {
    id: number | null
    responsableId: number | null
    convoTypeId: number | null
  }

  export type ConvocatoriaSumAggregateOutputType = {
    id: number | null
    responsableId: number | null
    convoTypeId: number | null
  }

  export type ConvocatoriaMinAggregateOutputType = {
    id: number | null
    date: Date | null
    title: string | null
    ubiSortida: string | null
    responsableId: number | null
    convoTypeId: number | null
    moreThan2: boolean | null
    startTime: Date | null
    finalTime: Date | null
    isActive: boolean | null
    autoAssignResponsable: boolean | null
    sortida: boolean | null
  }

  export type ConvocatoriaMaxAggregateOutputType = {
    id: number | null
    date: Date | null
    title: string | null
    ubiSortida: string | null
    responsableId: number | null
    convoTypeId: number | null
    moreThan2: boolean | null
    startTime: Date | null
    finalTime: Date | null
    isActive: boolean | null
    autoAssignResponsable: boolean | null
    sortida: boolean | null
  }

  export type ConvocatoriaCountAggregateOutputType = {
    id: number
    date: number
    title: number
    ubiSortida: number
    responsableId: number
    convoTypeId: number
    moreThan2: number
    startTime: number
    finalTime: number
    isActive: number
    autoAssignResponsable: number
    sortida: number
    _all: number
  }


  export type ConvocatoriaAvgAggregateInputType = {
    id?: true
    responsableId?: true
    convoTypeId?: true
  }

  export type ConvocatoriaSumAggregateInputType = {
    id?: true
    responsableId?: true
    convoTypeId?: true
  }

  export type ConvocatoriaMinAggregateInputType = {
    id?: true
    date?: true
    title?: true
    ubiSortida?: true
    responsableId?: true
    convoTypeId?: true
    moreThan2?: true
    startTime?: true
    finalTime?: true
    isActive?: true
    autoAssignResponsable?: true
    sortida?: true
  }

  export type ConvocatoriaMaxAggregateInputType = {
    id?: true
    date?: true
    title?: true
    ubiSortida?: true
    responsableId?: true
    convoTypeId?: true
    moreThan2?: true
    startTime?: true
    finalTime?: true
    isActive?: true
    autoAssignResponsable?: true
    sortida?: true
  }

  export type ConvocatoriaCountAggregateInputType = {
    id?: true
    date?: true
    title?: true
    ubiSortida?: true
    responsableId?: true
    convoTypeId?: true
    moreThan2?: true
    startTime?: true
    finalTime?: true
    isActive?: true
    autoAssignResponsable?: true
    sortida?: true
    _all?: true
  }

  export type ConvocatoriaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Convocatoria to aggregate.
     */
    where?: ConvocatoriaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Convocatorias to fetch.
     */
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConvocatoriaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Convocatorias from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Convocatorias.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Convocatorias
    **/
    _count?: true | ConvocatoriaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ConvocatoriaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ConvocatoriaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConvocatoriaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConvocatoriaMaxAggregateInputType
  }

  export type GetConvocatoriaAggregateType<T extends ConvocatoriaAggregateArgs> = {
        [P in keyof T & keyof AggregateConvocatoria]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConvocatoria[P]>
      : GetScalarType<T[P], AggregateConvocatoria[P]>
  }




  export type ConvocatoriaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConvocatoriaWhereInput
    orderBy?: ConvocatoriaOrderByWithAggregationInput | ConvocatoriaOrderByWithAggregationInput[]
    by: ConvocatoriaScalarFieldEnum[] | ConvocatoriaScalarFieldEnum
    having?: ConvocatoriaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConvocatoriaCountAggregateInputType | true
    _avg?: ConvocatoriaAvgAggregateInputType
    _sum?: ConvocatoriaSumAggregateInputType
    _min?: ConvocatoriaMinAggregateInputType
    _max?: ConvocatoriaMaxAggregateInputType
  }

  export type ConvocatoriaGroupByOutputType = {
    id: number
    date: Date
    title: string
    ubiSortida: string
    responsableId: number
    convoTypeId: number
    moreThan2: boolean
    startTime: Date
    finalTime: Date | null
    isActive: boolean
    autoAssignResponsable: boolean
    sortida: boolean
    _count: ConvocatoriaCountAggregateOutputType | null
    _avg: ConvocatoriaAvgAggregateOutputType | null
    _sum: ConvocatoriaSumAggregateOutputType | null
    _min: ConvocatoriaMinAggregateOutputType | null
    _max: ConvocatoriaMaxAggregateOutputType | null
  }

  type GetConvocatoriaGroupByPayload<T extends ConvocatoriaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConvocatoriaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConvocatoriaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConvocatoriaGroupByOutputType[P]>
            : GetScalarType<T[P], ConvocatoriaGroupByOutputType[P]>
        }
      >
    >


  export type ConvocatoriaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    title?: boolean
    ubiSortida?: boolean
    responsableId?: boolean
    convoTypeId?: boolean
    moreThan2?: boolean
    startTime?: boolean
    finalTime?: boolean
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    convoType?: boolean | ConvoTypeDefaultArgs<ExtArgs>
    respostas?: boolean | Convocatoria$respostasArgs<ExtArgs>
    _count?: boolean | ConvocatoriaCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["convocatoria"]>

  export type ConvocatoriaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    title?: boolean
    ubiSortida?: boolean
    responsableId?: boolean
    convoTypeId?: boolean
    moreThan2?: boolean
    startTime?: boolean
    finalTime?: boolean
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    convoType?: boolean | ConvoTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["convocatoria"]>

  export type ConvocatoriaSelectScalar = {
    id?: boolean
    date?: boolean
    title?: boolean
    ubiSortida?: boolean
    responsableId?: boolean
    convoTypeId?: boolean
    moreThan2?: boolean
    startTime?: boolean
    finalTime?: boolean
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
  }

  export type ConvocatoriaInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    convoType?: boolean | ConvoTypeDefaultArgs<ExtArgs>
    respostas?: boolean | Convocatoria$respostasArgs<ExtArgs>
    _count?: boolean | ConvocatoriaCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ConvocatoriaIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    convoType?: boolean | ConvoTypeDefaultArgs<ExtArgs>
  }

  export type $ConvocatoriaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Convocatoria"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      convoType: Prisma.$ConvoTypePayload<ExtArgs>
      respostas: Prisma.$RespuestaPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      date: Date
      title: string
      ubiSortida: string
      responsableId: number
      convoTypeId: number
      moreThan2: boolean
      startTime: Date
      finalTime: Date | null
      isActive: boolean
      autoAssignResponsable: boolean
      sortida: boolean
    }, ExtArgs["result"]["convocatoria"]>
    composites: {}
  }

  type ConvocatoriaGetPayload<S extends boolean | null | undefined | ConvocatoriaDefaultArgs> = $Result.GetResult<Prisma.$ConvocatoriaPayload, S>

  type ConvocatoriaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ConvocatoriaFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ConvocatoriaCountAggregateInputType | true
    }

  export interface ConvocatoriaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Convocatoria'], meta: { name: 'Convocatoria' } }
    /**
     * Find zero or one Convocatoria that matches the filter.
     * @param {ConvocatoriaFindUniqueArgs} args - Arguments to find a Convocatoria
     * @example
     * // Get one Convocatoria
     * const convocatoria = await prisma.convocatoria.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConvocatoriaFindUniqueArgs>(args: SelectSubset<T, ConvocatoriaFindUniqueArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Convocatoria that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ConvocatoriaFindUniqueOrThrowArgs} args - Arguments to find a Convocatoria
     * @example
     * // Get one Convocatoria
     * const convocatoria = await prisma.convocatoria.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConvocatoriaFindUniqueOrThrowArgs>(args: SelectSubset<T, ConvocatoriaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Convocatoria that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaFindFirstArgs} args - Arguments to find a Convocatoria
     * @example
     * // Get one Convocatoria
     * const convocatoria = await prisma.convocatoria.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConvocatoriaFindFirstArgs>(args?: SelectSubset<T, ConvocatoriaFindFirstArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Convocatoria that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaFindFirstOrThrowArgs} args - Arguments to find a Convocatoria
     * @example
     * // Get one Convocatoria
     * const convocatoria = await prisma.convocatoria.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConvocatoriaFindFirstOrThrowArgs>(args?: SelectSubset<T, ConvocatoriaFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Convocatorias that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Convocatorias
     * const convocatorias = await prisma.convocatoria.findMany()
     * 
     * // Get first 10 Convocatorias
     * const convocatorias = await prisma.convocatoria.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const convocatoriaWithIdOnly = await prisma.convocatoria.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConvocatoriaFindManyArgs>(args?: SelectSubset<T, ConvocatoriaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Convocatoria.
     * @param {ConvocatoriaCreateArgs} args - Arguments to create a Convocatoria.
     * @example
     * // Create one Convocatoria
     * const Convocatoria = await prisma.convocatoria.create({
     *   data: {
     *     // ... data to create a Convocatoria
     *   }
     * })
     * 
     */
    create<T extends ConvocatoriaCreateArgs>(args: SelectSubset<T, ConvocatoriaCreateArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Convocatorias.
     * @param {ConvocatoriaCreateManyArgs} args - Arguments to create many Convocatorias.
     * @example
     * // Create many Convocatorias
     * const convocatoria = await prisma.convocatoria.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConvocatoriaCreateManyArgs>(args?: SelectSubset<T, ConvocatoriaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Convocatorias and returns the data saved in the database.
     * @param {ConvocatoriaCreateManyAndReturnArgs} args - Arguments to create many Convocatorias.
     * @example
     * // Create many Convocatorias
     * const convocatoria = await prisma.convocatoria.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Convocatorias and only return the `id`
     * const convocatoriaWithIdOnly = await prisma.convocatoria.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConvocatoriaCreateManyAndReturnArgs>(args?: SelectSubset<T, ConvocatoriaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Convocatoria.
     * @param {ConvocatoriaDeleteArgs} args - Arguments to delete one Convocatoria.
     * @example
     * // Delete one Convocatoria
     * const Convocatoria = await prisma.convocatoria.delete({
     *   where: {
     *     // ... filter to delete one Convocatoria
     *   }
     * })
     * 
     */
    delete<T extends ConvocatoriaDeleteArgs>(args: SelectSubset<T, ConvocatoriaDeleteArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Convocatoria.
     * @param {ConvocatoriaUpdateArgs} args - Arguments to update one Convocatoria.
     * @example
     * // Update one Convocatoria
     * const convocatoria = await prisma.convocatoria.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConvocatoriaUpdateArgs>(args: SelectSubset<T, ConvocatoriaUpdateArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Convocatorias.
     * @param {ConvocatoriaDeleteManyArgs} args - Arguments to filter Convocatorias to delete.
     * @example
     * // Delete a few Convocatorias
     * const { count } = await prisma.convocatoria.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConvocatoriaDeleteManyArgs>(args?: SelectSubset<T, ConvocatoriaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Convocatorias.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Convocatorias
     * const convocatoria = await prisma.convocatoria.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConvocatoriaUpdateManyArgs>(args: SelectSubset<T, ConvocatoriaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Convocatoria.
     * @param {ConvocatoriaUpsertArgs} args - Arguments to update or create a Convocatoria.
     * @example
     * // Update or create a Convocatoria
     * const convocatoria = await prisma.convocatoria.upsert({
     *   create: {
     *     // ... data to create a Convocatoria
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Convocatoria we want to update
     *   }
     * })
     */
    upsert<T extends ConvocatoriaUpsertArgs>(args: SelectSubset<T, ConvocatoriaUpsertArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Convocatorias.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaCountArgs} args - Arguments to filter Convocatorias to count.
     * @example
     * // Count the number of Convocatorias
     * const count = await prisma.convocatoria.count({
     *   where: {
     *     // ... the filter for the Convocatorias we want to count
     *   }
     * })
    **/
    count<T extends ConvocatoriaCountArgs>(
      args?: Subset<T, ConvocatoriaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConvocatoriaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Convocatoria.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConvocatoriaAggregateArgs>(args: Subset<T, ConvocatoriaAggregateArgs>): Prisma.PrismaPromise<GetConvocatoriaAggregateType<T>>

    /**
     * Group by Convocatoria.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConvocatoriaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConvocatoriaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConvocatoriaGroupByArgs['orderBy'] }
        : { orderBy?: ConvocatoriaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConvocatoriaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConvocatoriaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Convocatoria model
   */
  readonly fields: ConvocatoriaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Convocatoria.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConvocatoriaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    convoType<T extends ConvoTypeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConvoTypeDefaultArgs<ExtArgs>>): Prisma__ConvoTypeClient<$Result.GetResult<Prisma.$ConvoTypePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    respostas<T extends Convocatoria$respostasArgs<ExtArgs> = {}>(args?: Subset<T, Convocatoria$respostasArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Convocatoria model
   */ 
  interface ConvocatoriaFieldRefs {
    readonly id: FieldRef<"Convocatoria", 'Int'>
    readonly date: FieldRef<"Convocatoria", 'DateTime'>
    readonly title: FieldRef<"Convocatoria", 'String'>
    readonly ubiSortida: FieldRef<"Convocatoria", 'String'>
    readonly responsableId: FieldRef<"Convocatoria", 'Int'>
    readonly convoTypeId: FieldRef<"Convocatoria", 'Int'>
    readonly moreThan2: FieldRef<"Convocatoria", 'Boolean'>
    readonly startTime: FieldRef<"Convocatoria", 'DateTime'>
    readonly finalTime: FieldRef<"Convocatoria", 'DateTime'>
    readonly isActive: FieldRef<"Convocatoria", 'Boolean'>
    readonly autoAssignResponsable: FieldRef<"Convocatoria", 'Boolean'>
    readonly sortida: FieldRef<"Convocatoria", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Convocatoria findUnique
   */
  export type ConvocatoriaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter, which Convocatoria to fetch.
     */
    where: ConvocatoriaWhereUniqueInput
  }

  /**
   * Convocatoria findUniqueOrThrow
   */
  export type ConvocatoriaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter, which Convocatoria to fetch.
     */
    where: ConvocatoriaWhereUniqueInput
  }

  /**
   * Convocatoria findFirst
   */
  export type ConvocatoriaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter, which Convocatoria to fetch.
     */
    where?: ConvocatoriaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Convocatorias to fetch.
     */
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Convocatorias.
     */
    cursor?: ConvocatoriaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Convocatorias from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Convocatorias.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Convocatorias.
     */
    distinct?: ConvocatoriaScalarFieldEnum | ConvocatoriaScalarFieldEnum[]
  }

  /**
   * Convocatoria findFirstOrThrow
   */
  export type ConvocatoriaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter, which Convocatoria to fetch.
     */
    where?: ConvocatoriaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Convocatorias to fetch.
     */
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Convocatorias.
     */
    cursor?: ConvocatoriaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Convocatorias from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Convocatorias.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Convocatorias.
     */
    distinct?: ConvocatoriaScalarFieldEnum | ConvocatoriaScalarFieldEnum[]
  }

  /**
   * Convocatoria findMany
   */
  export type ConvocatoriaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter, which Convocatorias to fetch.
     */
    where?: ConvocatoriaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Convocatorias to fetch.
     */
    orderBy?: ConvocatoriaOrderByWithRelationInput | ConvocatoriaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Convocatorias.
     */
    cursor?: ConvocatoriaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Convocatorias from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Convocatorias.
     */
    skip?: number
    distinct?: ConvocatoriaScalarFieldEnum | ConvocatoriaScalarFieldEnum[]
  }

  /**
   * Convocatoria create
   */
  export type ConvocatoriaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * The data needed to create a Convocatoria.
     */
    data: XOR<ConvocatoriaCreateInput, ConvocatoriaUncheckedCreateInput>
  }

  /**
   * Convocatoria createMany
   */
  export type ConvocatoriaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Convocatorias.
     */
    data: ConvocatoriaCreateManyInput | ConvocatoriaCreateManyInput[]
  }

  /**
   * Convocatoria createManyAndReturn
   */
  export type ConvocatoriaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Convocatorias.
     */
    data: ConvocatoriaCreateManyInput | ConvocatoriaCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Convocatoria update
   */
  export type ConvocatoriaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * The data needed to update a Convocatoria.
     */
    data: XOR<ConvocatoriaUpdateInput, ConvocatoriaUncheckedUpdateInput>
    /**
     * Choose, which Convocatoria to update.
     */
    where: ConvocatoriaWhereUniqueInput
  }

  /**
   * Convocatoria updateMany
   */
  export type ConvocatoriaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Convocatorias.
     */
    data: XOR<ConvocatoriaUpdateManyMutationInput, ConvocatoriaUncheckedUpdateManyInput>
    /**
     * Filter which Convocatorias to update
     */
    where?: ConvocatoriaWhereInput
  }

  /**
   * Convocatoria upsert
   */
  export type ConvocatoriaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * The filter to search for the Convocatoria to update in case it exists.
     */
    where: ConvocatoriaWhereUniqueInput
    /**
     * In case the Convocatoria found by the `where` argument doesn't exist, create a new Convocatoria with this data.
     */
    create: XOR<ConvocatoriaCreateInput, ConvocatoriaUncheckedCreateInput>
    /**
     * In case the Convocatoria was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConvocatoriaUpdateInput, ConvocatoriaUncheckedUpdateInput>
  }

  /**
   * Convocatoria delete
   */
  export type ConvocatoriaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
    /**
     * Filter which Convocatoria to delete.
     */
    where: ConvocatoriaWhereUniqueInput
  }

  /**
   * Convocatoria deleteMany
   */
  export type ConvocatoriaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Convocatorias to delete
     */
    where?: ConvocatoriaWhereInput
  }

  /**
   * Convocatoria.respostas
   */
  export type Convocatoria$respostasArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    where?: RespuestaWhereInput
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    cursor?: RespuestaWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RespuestaScalarFieldEnum | RespuestaScalarFieldEnum[]
  }

  /**
   * Convocatoria without action
   */
  export type ConvocatoriaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Convocatoria
     */
    select?: ConvocatoriaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConvocatoriaInclude<ExtArgs> | null
  }


  /**
   * Model Respuesta
   */

  export type AggregateRespuesta = {
    _count: RespuestaCountAggregateOutputType | null
    _avg: RespuestaAvgAggregateOutputType | null
    _sum: RespuestaSumAggregateOutputType | null
    _min: RespuestaMinAggregateOutputType | null
    _max: RespuestaMaxAggregateOutputType | null
  }

  export type RespuestaAvgAggregateOutputType = {
    id: number | null
    convoId: number | null
  }

  export type RespuestaSumAggregateOutputType = {
    id: number | null
    convoId: number | null
  }

  export type RespuestaMinAggregateOutputType = {
    id: number | null
    convoId: number | null
    userNCarnet: string | null
    isCustom: boolean | null
    customText: string | null
    fullHorari: boolean | null
    response: boolean | null
  }

  export type RespuestaMaxAggregateOutputType = {
    id: number | null
    convoId: number | null
    userNCarnet: string | null
    isCustom: boolean | null
    customText: string | null
    fullHorari: boolean | null
    response: boolean | null
  }

  export type RespuestaCountAggregateOutputType = {
    id: number
    convoId: number
    userNCarnet: number
    isCustom: number
    customText: number
    fullHorari: number
    response: number
    _all: number
  }


  export type RespuestaAvgAggregateInputType = {
    id?: true
    convoId?: true
  }

  export type RespuestaSumAggregateInputType = {
    id?: true
    convoId?: true
  }

  export type RespuestaMinAggregateInputType = {
    id?: true
    convoId?: true
    userNCarnet?: true
    isCustom?: true
    customText?: true
    fullHorari?: true
    response?: true
  }

  export type RespuestaMaxAggregateInputType = {
    id?: true
    convoId?: true
    userNCarnet?: true
    isCustom?: true
    customText?: true
    fullHorari?: true
    response?: true
  }

  export type RespuestaCountAggregateInputType = {
    id?: true
    convoId?: true
    userNCarnet?: true
    isCustom?: true
    customText?: true
    fullHorari?: true
    response?: true
    _all?: true
  }

  export type RespuestaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Respuesta to aggregate.
     */
    where?: RespuestaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Respuestas to fetch.
     */
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RespuestaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Respuestas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Respuestas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Respuestas
    **/
    _count?: true | RespuestaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RespuestaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RespuestaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RespuestaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RespuestaMaxAggregateInputType
  }

  export type GetRespuestaAggregateType<T extends RespuestaAggregateArgs> = {
        [P in keyof T & keyof AggregateRespuesta]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRespuesta[P]>
      : GetScalarType<T[P], AggregateRespuesta[P]>
  }




  export type RespuestaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RespuestaWhereInput
    orderBy?: RespuestaOrderByWithAggregationInput | RespuestaOrderByWithAggregationInput[]
    by: RespuestaScalarFieldEnum[] | RespuestaScalarFieldEnum
    having?: RespuestaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RespuestaCountAggregateInputType | true
    _avg?: RespuestaAvgAggregateInputType
    _sum?: RespuestaSumAggregateInputType
    _min?: RespuestaMinAggregateInputType
    _max?: RespuestaMaxAggregateInputType
  }

  export type RespuestaGroupByOutputType = {
    id: number
    convoId: number
    userNCarnet: string
    isCustom: boolean
    customText: string | null
    fullHorari: boolean
    response: boolean
    _count: RespuestaCountAggregateOutputType | null
    _avg: RespuestaAvgAggregateOutputType | null
    _sum: RespuestaSumAggregateOutputType | null
    _min: RespuestaMinAggregateOutputType | null
    _max: RespuestaMaxAggregateOutputType | null
  }

  type GetRespuestaGroupByPayload<T extends RespuestaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RespuestaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RespuestaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RespuestaGroupByOutputType[P]>
            : GetScalarType<T[P], RespuestaGroupByOutputType[P]>
        }
      >
    >


  export type RespuestaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    convoId?: boolean
    userNCarnet?: boolean
    isCustom?: boolean
    customText?: boolean
    fullHorari?: boolean
    response?: boolean
    convocatoria?: boolean | ConvocatoriaDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["respuesta"]>

  export type RespuestaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    convoId?: boolean
    userNCarnet?: boolean
    isCustom?: boolean
    customText?: boolean
    fullHorari?: boolean
    response?: boolean
    convocatoria?: boolean | ConvocatoriaDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["respuesta"]>

  export type RespuestaSelectScalar = {
    id?: boolean
    convoId?: boolean
    userNCarnet?: boolean
    isCustom?: boolean
    customText?: boolean
    fullHorari?: boolean
    response?: boolean
  }

  export type RespuestaInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    convocatoria?: boolean | ConvocatoriaDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RespuestaIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    convocatoria?: boolean | ConvocatoriaDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RespuestaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Respuesta"
    objects: {
      convocatoria: Prisma.$ConvocatoriaPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      convoId: number
      userNCarnet: string
      isCustom: boolean
      customText: string | null
      fullHorari: boolean
      response: boolean
    }, ExtArgs["result"]["respuesta"]>
    composites: {}
  }

  type RespuestaGetPayload<S extends boolean | null | undefined | RespuestaDefaultArgs> = $Result.GetResult<Prisma.$RespuestaPayload, S>

  type RespuestaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RespuestaFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RespuestaCountAggregateInputType | true
    }

  export interface RespuestaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Respuesta'], meta: { name: 'Respuesta' } }
    /**
     * Find zero or one Respuesta that matches the filter.
     * @param {RespuestaFindUniqueArgs} args - Arguments to find a Respuesta
     * @example
     * // Get one Respuesta
     * const respuesta = await prisma.respuesta.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RespuestaFindUniqueArgs>(args: SelectSubset<T, RespuestaFindUniqueArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Respuesta that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RespuestaFindUniqueOrThrowArgs} args - Arguments to find a Respuesta
     * @example
     * // Get one Respuesta
     * const respuesta = await prisma.respuesta.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RespuestaFindUniqueOrThrowArgs>(args: SelectSubset<T, RespuestaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Respuesta that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaFindFirstArgs} args - Arguments to find a Respuesta
     * @example
     * // Get one Respuesta
     * const respuesta = await prisma.respuesta.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RespuestaFindFirstArgs>(args?: SelectSubset<T, RespuestaFindFirstArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Respuesta that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaFindFirstOrThrowArgs} args - Arguments to find a Respuesta
     * @example
     * // Get one Respuesta
     * const respuesta = await prisma.respuesta.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RespuestaFindFirstOrThrowArgs>(args?: SelectSubset<T, RespuestaFindFirstOrThrowArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Respuestas that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Respuestas
     * const respuestas = await prisma.respuesta.findMany()
     * 
     * // Get first 10 Respuestas
     * const respuestas = await prisma.respuesta.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const respuestaWithIdOnly = await prisma.respuesta.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RespuestaFindManyArgs>(args?: SelectSubset<T, RespuestaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Respuesta.
     * @param {RespuestaCreateArgs} args - Arguments to create a Respuesta.
     * @example
     * // Create one Respuesta
     * const Respuesta = await prisma.respuesta.create({
     *   data: {
     *     // ... data to create a Respuesta
     *   }
     * })
     * 
     */
    create<T extends RespuestaCreateArgs>(args: SelectSubset<T, RespuestaCreateArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Respuestas.
     * @param {RespuestaCreateManyArgs} args - Arguments to create many Respuestas.
     * @example
     * // Create many Respuestas
     * const respuesta = await prisma.respuesta.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RespuestaCreateManyArgs>(args?: SelectSubset<T, RespuestaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Respuestas and returns the data saved in the database.
     * @param {RespuestaCreateManyAndReturnArgs} args - Arguments to create many Respuestas.
     * @example
     * // Create many Respuestas
     * const respuesta = await prisma.respuesta.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Respuestas and only return the `id`
     * const respuestaWithIdOnly = await prisma.respuesta.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RespuestaCreateManyAndReturnArgs>(args?: SelectSubset<T, RespuestaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Respuesta.
     * @param {RespuestaDeleteArgs} args - Arguments to delete one Respuesta.
     * @example
     * // Delete one Respuesta
     * const Respuesta = await prisma.respuesta.delete({
     *   where: {
     *     // ... filter to delete one Respuesta
     *   }
     * })
     * 
     */
    delete<T extends RespuestaDeleteArgs>(args: SelectSubset<T, RespuestaDeleteArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Respuesta.
     * @param {RespuestaUpdateArgs} args - Arguments to update one Respuesta.
     * @example
     * // Update one Respuesta
     * const respuesta = await prisma.respuesta.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RespuestaUpdateArgs>(args: SelectSubset<T, RespuestaUpdateArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Respuestas.
     * @param {RespuestaDeleteManyArgs} args - Arguments to filter Respuestas to delete.
     * @example
     * // Delete a few Respuestas
     * const { count } = await prisma.respuesta.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RespuestaDeleteManyArgs>(args?: SelectSubset<T, RespuestaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Respuestas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Respuestas
     * const respuesta = await prisma.respuesta.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RespuestaUpdateManyArgs>(args: SelectSubset<T, RespuestaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Respuesta.
     * @param {RespuestaUpsertArgs} args - Arguments to update or create a Respuesta.
     * @example
     * // Update or create a Respuesta
     * const respuesta = await prisma.respuesta.upsert({
     *   create: {
     *     // ... data to create a Respuesta
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Respuesta we want to update
     *   }
     * })
     */
    upsert<T extends RespuestaUpsertArgs>(args: SelectSubset<T, RespuestaUpsertArgs<ExtArgs>>): Prisma__RespuestaClient<$Result.GetResult<Prisma.$RespuestaPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Respuestas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaCountArgs} args - Arguments to filter Respuestas to count.
     * @example
     * // Count the number of Respuestas
     * const count = await prisma.respuesta.count({
     *   where: {
     *     // ... the filter for the Respuestas we want to count
     *   }
     * })
    **/
    count<T extends RespuestaCountArgs>(
      args?: Subset<T, RespuestaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RespuestaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Respuesta.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RespuestaAggregateArgs>(args: Subset<T, RespuestaAggregateArgs>): Prisma.PrismaPromise<GetRespuestaAggregateType<T>>

    /**
     * Group by Respuesta.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RespuestaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RespuestaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RespuestaGroupByArgs['orderBy'] }
        : { orderBy?: RespuestaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RespuestaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRespuestaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Respuesta model
   */
  readonly fields: RespuestaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Respuesta.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RespuestaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    convocatoria<T extends ConvocatoriaDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ConvocatoriaDefaultArgs<ExtArgs>>): Prisma__ConvocatoriaClient<$Result.GetResult<Prisma.$ConvocatoriaPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Respuesta model
   */ 
  interface RespuestaFieldRefs {
    readonly id: FieldRef<"Respuesta", 'Int'>
    readonly convoId: FieldRef<"Respuesta", 'Int'>
    readonly userNCarnet: FieldRef<"Respuesta", 'String'>
    readonly isCustom: FieldRef<"Respuesta", 'Boolean'>
    readonly customText: FieldRef<"Respuesta", 'String'>
    readonly fullHorari: FieldRef<"Respuesta", 'Boolean'>
    readonly response: FieldRef<"Respuesta", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Respuesta findUnique
   */
  export type RespuestaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter, which Respuesta to fetch.
     */
    where: RespuestaWhereUniqueInput
  }

  /**
   * Respuesta findUniqueOrThrow
   */
  export type RespuestaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter, which Respuesta to fetch.
     */
    where: RespuestaWhereUniqueInput
  }

  /**
   * Respuesta findFirst
   */
  export type RespuestaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter, which Respuesta to fetch.
     */
    where?: RespuestaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Respuestas to fetch.
     */
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Respuestas.
     */
    cursor?: RespuestaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Respuestas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Respuestas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Respuestas.
     */
    distinct?: RespuestaScalarFieldEnum | RespuestaScalarFieldEnum[]
  }

  /**
   * Respuesta findFirstOrThrow
   */
  export type RespuestaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter, which Respuesta to fetch.
     */
    where?: RespuestaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Respuestas to fetch.
     */
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Respuestas.
     */
    cursor?: RespuestaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Respuestas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Respuestas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Respuestas.
     */
    distinct?: RespuestaScalarFieldEnum | RespuestaScalarFieldEnum[]
  }

  /**
   * Respuesta findMany
   */
  export type RespuestaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter, which Respuestas to fetch.
     */
    where?: RespuestaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Respuestas to fetch.
     */
    orderBy?: RespuestaOrderByWithRelationInput | RespuestaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Respuestas.
     */
    cursor?: RespuestaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Respuestas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Respuestas.
     */
    skip?: number
    distinct?: RespuestaScalarFieldEnum | RespuestaScalarFieldEnum[]
  }

  /**
   * Respuesta create
   */
  export type RespuestaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * The data needed to create a Respuesta.
     */
    data: XOR<RespuestaCreateInput, RespuestaUncheckedCreateInput>
  }

  /**
   * Respuesta createMany
   */
  export type RespuestaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Respuestas.
     */
    data: RespuestaCreateManyInput | RespuestaCreateManyInput[]
  }

  /**
   * Respuesta createManyAndReturn
   */
  export type RespuestaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Respuestas.
     */
    data: RespuestaCreateManyInput | RespuestaCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Respuesta update
   */
  export type RespuestaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * The data needed to update a Respuesta.
     */
    data: XOR<RespuestaUpdateInput, RespuestaUncheckedUpdateInput>
    /**
     * Choose, which Respuesta to update.
     */
    where: RespuestaWhereUniqueInput
  }

  /**
   * Respuesta updateMany
   */
  export type RespuestaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Respuestas.
     */
    data: XOR<RespuestaUpdateManyMutationInput, RespuestaUncheckedUpdateManyInput>
    /**
     * Filter which Respuestas to update
     */
    where?: RespuestaWhereInput
  }

  /**
   * Respuesta upsert
   */
  export type RespuestaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * The filter to search for the Respuesta to update in case it exists.
     */
    where: RespuestaWhereUniqueInput
    /**
     * In case the Respuesta found by the `where` argument doesn't exist, create a new Respuesta with this data.
     */
    create: XOR<RespuestaCreateInput, RespuestaUncheckedCreateInput>
    /**
     * In case the Respuesta was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RespuestaUpdateInput, RespuestaUncheckedUpdateInput>
  }

  /**
   * Respuesta delete
   */
  export type RespuestaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
    /**
     * Filter which Respuesta to delete.
     */
    where: RespuestaWhereUniqueInput
  }

  /**
   * Respuesta deleteMany
   */
  export type RespuestaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Respuestas to delete
     */
    where?: RespuestaWhereInput
  }

  /**
   * Respuesta without action
   */
  export type RespuestaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Respuesta
     */
    select?: RespuestaSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RespuestaInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    nCarnet: 'nCarnet',
    nIndicatiu: 'nIndicatiu',
    name: 'name',
    lastName: 'lastName',
    password: 'password',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const RoleScalarFieldEnum: {
    id: 'id',
    nCarnet: 'nCarnet',
    isCapOperatiu: 'isCapOperatiu',
    isCapColla: 'isCapColla',
    isAdmin: 'isAdmin',
    isGroc: 'isGroc'
  };

  export type RoleScalarFieldEnum = (typeof RoleScalarFieldEnum)[keyof typeof RoleScalarFieldEnum]


  export const ConvoTypeScalarFieldEnum: {
    id: 'id',
    name: 'name',
    minGrocSortida: 'minGrocSortida',
    minVerdSortida: 'minVerdSortida',
    defaultLocation: 'defaultLocation'
  };

  export type ConvoTypeScalarFieldEnum = (typeof ConvoTypeScalarFieldEnum)[keyof typeof ConvoTypeScalarFieldEnum]


  export const ConvocatoriaScalarFieldEnum: {
    id: 'id',
    date: 'date',
    title: 'title',
    ubiSortida: 'ubiSortida',
    responsableId: 'responsableId',
    convoTypeId: 'convoTypeId',
    moreThan2: 'moreThan2',
    startTime: 'startTime',
    finalTime: 'finalTime',
    isActive: 'isActive',
    autoAssignResponsable: 'autoAssignResponsable',
    sortida: 'sortida'
  };

  export type ConvocatoriaScalarFieldEnum = (typeof ConvocatoriaScalarFieldEnum)[keyof typeof ConvocatoriaScalarFieldEnum]


  export const RespuestaScalarFieldEnum: {
    id: 'id',
    convoId: 'convoId',
    userNCarnet: 'userNCarnet',
    isCustom: 'isCustom',
    customText: 'customText',
    fullHorari: 'fullHorari',
    response: 'response'
  };

  export type RespuestaScalarFieldEnum = (typeof RespuestaScalarFieldEnum)[keyof typeof RespuestaScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    nCarnet?: StringFilter<"User"> | string
    nIndicatiu?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    lastName?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    isActive?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    roles?: RoleListRelationFilter
    convocatories?: ConvocatoriaListRelationFilter
    respostas?: RespuestaListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    nIndicatiu?: SortOrderInput | SortOrder
    name?: SortOrder
    lastName?: SortOrderInput | SortOrder
    password?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    roles?: RoleOrderByRelationAggregateInput
    convocatories?: ConvocatoriaOrderByRelationAggregateInput
    respostas?: RespuestaOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    nCarnet?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    nIndicatiu?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    lastName?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    isActive?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    roles?: RoleListRelationFilter
    convocatories?: ConvocatoriaListRelationFilter
    respostas?: RespuestaListRelationFilter
  }, "id" | "nCarnet">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    nIndicatiu?: SortOrderInput | SortOrder
    name?: SortOrder
    lastName?: SortOrderInput | SortOrder
    password?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    nCarnet?: StringWithAggregatesFilter<"User"> | string
    nIndicatiu?: StringNullableWithAggregatesFilter<"User"> | string | null
    name?: StringWithAggregatesFilter<"User"> | string
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    password?: StringWithAggregatesFilter<"User"> | string
    isActive?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type RoleWhereInput = {
    AND?: RoleWhereInput | RoleWhereInput[]
    OR?: RoleWhereInput[]
    NOT?: RoleWhereInput | RoleWhereInput[]
    id?: IntFilter<"Role"> | number
    nCarnet?: StringFilter<"Role"> | string
    isCapOperatiu?: BoolFilter<"Role"> | boolean
    isCapColla?: BoolFilter<"Role"> | boolean
    isAdmin?: BoolFilter<"Role"> | boolean
    isGroc?: BoolFilter<"Role"> | boolean
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type RoleOrderByWithRelationInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    isCapOperatiu?: SortOrder
    isCapColla?: SortOrder
    isAdmin?: SortOrder
    isGroc?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type RoleWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: RoleWhereInput | RoleWhereInput[]
    OR?: RoleWhereInput[]
    NOT?: RoleWhereInput | RoleWhereInput[]
    nCarnet?: StringFilter<"Role"> | string
    isCapOperatiu?: BoolFilter<"Role"> | boolean
    isCapColla?: BoolFilter<"Role"> | boolean
    isAdmin?: BoolFilter<"Role"> | boolean
    isGroc?: BoolFilter<"Role"> | boolean
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type RoleOrderByWithAggregationInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    isCapOperatiu?: SortOrder
    isCapColla?: SortOrder
    isAdmin?: SortOrder
    isGroc?: SortOrder
    _count?: RoleCountOrderByAggregateInput
    _avg?: RoleAvgOrderByAggregateInput
    _max?: RoleMaxOrderByAggregateInput
    _min?: RoleMinOrderByAggregateInput
    _sum?: RoleSumOrderByAggregateInput
  }

  export type RoleScalarWhereWithAggregatesInput = {
    AND?: RoleScalarWhereWithAggregatesInput | RoleScalarWhereWithAggregatesInput[]
    OR?: RoleScalarWhereWithAggregatesInput[]
    NOT?: RoleScalarWhereWithAggregatesInput | RoleScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Role"> | number
    nCarnet?: StringWithAggregatesFilter<"Role"> | string
    isCapOperatiu?: BoolWithAggregatesFilter<"Role"> | boolean
    isCapColla?: BoolWithAggregatesFilter<"Role"> | boolean
    isAdmin?: BoolWithAggregatesFilter<"Role"> | boolean
    isGroc?: BoolWithAggregatesFilter<"Role"> | boolean
  }

  export type ConvoTypeWhereInput = {
    AND?: ConvoTypeWhereInput | ConvoTypeWhereInput[]
    OR?: ConvoTypeWhereInput[]
    NOT?: ConvoTypeWhereInput | ConvoTypeWhereInput[]
    id?: IntFilter<"ConvoType"> | number
    name?: StringFilter<"ConvoType"> | string
    minGrocSortida?: IntFilter<"ConvoType"> | number
    minVerdSortida?: IntFilter<"ConvoType"> | number
    defaultLocation?: StringNullableFilter<"ConvoType"> | string | null
    convocatories?: ConvocatoriaListRelationFilter
  }

  export type ConvoTypeOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
    defaultLocation?: SortOrderInput | SortOrder
    convocatories?: ConvocatoriaOrderByRelationAggregateInput
  }

  export type ConvoTypeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    name?: string
    AND?: ConvoTypeWhereInput | ConvoTypeWhereInput[]
    OR?: ConvoTypeWhereInput[]
    NOT?: ConvoTypeWhereInput | ConvoTypeWhereInput[]
    minGrocSortida?: IntFilter<"ConvoType"> | number
    minVerdSortida?: IntFilter<"ConvoType"> | number
    defaultLocation?: StringNullableFilter<"ConvoType"> | string | null
    convocatories?: ConvocatoriaListRelationFilter
  }, "id" | "name">

  export type ConvoTypeOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
    defaultLocation?: SortOrderInput | SortOrder
    _count?: ConvoTypeCountOrderByAggregateInput
    _avg?: ConvoTypeAvgOrderByAggregateInput
    _max?: ConvoTypeMaxOrderByAggregateInput
    _min?: ConvoTypeMinOrderByAggregateInput
    _sum?: ConvoTypeSumOrderByAggregateInput
  }

  export type ConvoTypeScalarWhereWithAggregatesInput = {
    AND?: ConvoTypeScalarWhereWithAggregatesInput | ConvoTypeScalarWhereWithAggregatesInput[]
    OR?: ConvoTypeScalarWhereWithAggregatesInput[]
    NOT?: ConvoTypeScalarWhereWithAggregatesInput | ConvoTypeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"ConvoType"> | number
    name?: StringWithAggregatesFilter<"ConvoType"> | string
    minGrocSortida?: IntWithAggregatesFilter<"ConvoType"> | number
    minVerdSortida?: IntWithAggregatesFilter<"ConvoType"> | number
    defaultLocation?: StringNullableWithAggregatesFilter<"ConvoType"> | string | null
  }

  export type ConvocatoriaWhereInput = {
    AND?: ConvocatoriaWhereInput | ConvocatoriaWhereInput[]
    OR?: ConvocatoriaWhereInput[]
    NOT?: ConvocatoriaWhereInput | ConvocatoriaWhereInput[]
    id?: IntFilter<"Convocatoria"> | number
    date?: DateTimeFilter<"Convocatoria"> | Date | string
    title?: StringFilter<"Convocatoria"> | string
    ubiSortida?: StringFilter<"Convocatoria"> | string
    responsableId?: IntFilter<"Convocatoria"> | number
    convoTypeId?: IntFilter<"Convocatoria"> | number
    moreThan2?: BoolFilter<"Convocatoria"> | boolean
    startTime?: DateTimeFilter<"Convocatoria"> | Date | string
    finalTime?: DateTimeNullableFilter<"Convocatoria"> | Date | string | null
    isActive?: BoolFilter<"Convocatoria"> | boolean
    autoAssignResponsable?: BoolFilter<"Convocatoria"> | boolean
    sortida?: BoolFilter<"Convocatoria"> | boolean
    user?: XOR<UserRelationFilter, UserWhereInput>
    convoType?: XOR<ConvoTypeRelationFilter, ConvoTypeWhereInput>
    respostas?: RespuestaListRelationFilter
  }

  export type ConvocatoriaOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    title?: SortOrder
    ubiSortida?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
    moreThan2?: SortOrder
    startTime?: SortOrder
    finalTime?: SortOrderInput | SortOrder
    isActive?: SortOrder
    autoAssignResponsable?: SortOrder
    sortida?: SortOrder
    user?: UserOrderByWithRelationInput
    convoType?: ConvoTypeOrderByWithRelationInput
    respostas?: RespuestaOrderByRelationAggregateInput
  }

  export type ConvocatoriaWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ConvocatoriaWhereInput | ConvocatoriaWhereInput[]
    OR?: ConvocatoriaWhereInput[]
    NOT?: ConvocatoriaWhereInput | ConvocatoriaWhereInput[]
    date?: DateTimeFilter<"Convocatoria"> | Date | string
    title?: StringFilter<"Convocatoria"> | string
    ubiSortida?: StringFilter<"Convocatoria"> | string
    responsableId?: IntFilter<"Convocatoria"> | number
    convoTypeId?: IntFilter<"Convocatoria"> | number
    moreThan2?: BoolFilter<"Convocatoria"> | boolean
    startTime?: DateTimeFilter<"Convocatoria"> | Date | string
    finalTime?: DateTimeNullableFilter<"Convocatoria"> | Date | string | null
    isActive?: BoolFilter<"Convocatoria"> | boolean
    autoAssignResponsable?: BoolFilter<"Convocatoria"> | boolean
    sortida?: BoolFilter<"Convocatoria"> | boolean
    user?: XOR<UserRelationFilter, UserWhereInput>
    convoType?: XOR<ConvoTypeRelationFilter, ConvoTypeWhereInput>
    respostas?: RespuestaListRelationFilter
  }, "id">

  export type ConvocatoriaOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    title?: SortOrder
    ubiSortida?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
    moreThan2?: SortOrder
    startTime?: SortOrder
    finalTime?: SortOrderInput | SortOrder
    isActive?: SortOrder
    autoAssignResponsable?: SortOrder
    sortida?: SortOrder
    _count?: ConvocatoriaCountOrderByAggregateInput
    _avg?: ConvocatoriaAvgOrderByAggregateInput
    _max?: ConvocatoriaMaxOrderByAggregateInput
    _min?: ConvocatoriaMinOrderByAggregateInput
    _sum?: ConvocatoriaSumOrderByAggregateInput
  }

  export type ConvocatoriaScalarWhereWithAggregatesInput = {
    AND?: ConvocatoriaScalarWhereWithAggregatesInput | ConvocatoriaScalarWhereWithAggregatesInput[]
    OR?: ConvocatoriaScalarWhereWithAggregatesInput[]
    NOT?: ConvocatoriaScalarWhereWithAggregatesInput | ConvocatoriaScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Convocatoria"> | number
    date?: DateTimeWithAggregatesFilter<"Convocatoria"> | Date | string
    title?: StringWithAggregatesFilter<"Convocatoria"> | string
    ubiSortida?: StringWithAggregatesFilter<"Convocatoria"> | string
    responsableId?: IntWithAggregatesFilter<"Convocatoria"> | number
    convoTypeId?: IntWithAggregatesFilter<"Convocatoria"> | number
    moreThan2?: BoolWithAggregatesFilter<"Convocatoria"> | boolean
    startTime?: DateTimeWithAggregatesFilter<"Convocatoria"> | Date | string
    finalTime?: DateTimeNullableWithAggregatesFilter<"Convocatoria"> | Date | string | null
    isActive?: BoolWithAggregatesFilter<"Convocatoria"> | boolean
    autoAssignResponsable?: BoolWithAggregatesFilter<"Convocatoria"> | boolean
    sortida?: BoolWithAggregatesFilter<"Convocatoria"> | boolean
  }

  export type RespuestaWhereInput = {
    AND?: RespuestaWhereInput | RespuestaWhereInput[]
    OR?: RespuestaWhereInput[]
    NOT?: RespuestaWhereInput | RespuestaWhereInput[]
    id?: IntFilter<"Respuesta"> | number
    convoId?: IntFilter<"Respuesta"> | number
    userNCarnet?: StringFilter<"Respuesta"> | string
    isCustom?: BoolFilter<"Respuesta"> | boolean
    customText?: StringNullableFilter<"Respuesta"> | string | null
    fullHorari?: BoolFilter<"Respuesta"> | boolean
    response?: BoolFilter<"Respuesta"> | boolean
    convocatoria?: XOR<ConvocatoriaRelationFilter, ConvocatoriaWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type RespuestaOrderByWithRelationInput = {
    id?: SortOrder
    convoId?: SortOrder
    userNCarnet?: SortOrder
    isCustom?: SortOrder
    customText?: SortOrderInput | SortOrder
    fullHorari?: SortOrder
    response?: SortOrder
    convocatoria?: ConvocatoriaOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type RespuestaWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: RespuestaWhereInput | RespuestaWhereInput[]
    OR?: RespuestaWhereInput[]
    NOT?: RespuestaWhereInput | RespuestaWhereInput[]
    convoId?: IntFilter<"Respuesta"> | number
    userNCarnet?: StringFilter<"Respuesta"> | string
    isCustom?: BoolFilter<"Respuesta"> | boolean
    customText?: StringNullableFilter<"Respuesta"> | string | null
    fullHorari?: BoolFilter<"Respuesta"> | boolean
    response?: BoolFilter<"Respuesta"> | boolean
    convocatoria?: XOR<ConvocatoriaRelationFilter, ConvocatoriaWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type RespuestaOrderByWithAggregationInput = {
    id?: SortOrder
    convoId?: SortOrder
    userNCarnet?: SortOrder
    isCustom?: SortOrder
    customText?: SortOrderInput | SortOrder
    fullHorari?: SortOrder
    response?: SortOrder
    _count?: RespuestaCountOrderByAggregateInput
    _avg?: RespuestaAvgOrderByAggregateInput
    _max?: RespuestaMaxOrderByAggregateInput
    _min?: RespuestaMinOrderByAggregateInput
    _sum?: RespuestaSumOrderByAggregateInput
  }

  export type RespuestaScalarWhereWithAggregatesInput = {
    AND?: RespuestaScalarWhereWithAggregatesInput | RespuestaScalarWhereWithAggregatesInput[]
    OR?: RespuestaScalarWhereWithAggregatesInput[]
    NOT?: RespuestaScalarWhereWithAggregatesInput | RespuestaScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Respuesta"> | number
    convoId?: IntWithAggregatesFilter<"Respuesta"> | number
    userNCarnet?: StringWithAggregatesFilter<"Respuesta"> | string
    isCustom?: BoolWithAggregatesFilter<"Respuesta"> | boolean
    customText?: StringNullableWithAggregatesFilter<"Respuesta"> | string | null
    fullHorari?: BoolWithAggregatesFilter<"Respuesta"> | boolean
    response?: BoolWithAggregatesFilter<"Respuesta"> | boolean
  }

  export type UserCreateInput = {
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleCreateNestedManyWithoutUserInput
    convocatories?: ConvocatoriaCreateNestedManyWithoutUserInput
    respostas?: RespuestaCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleUncheckedCreateNestedManyWithoutUserInput
    convocatories?: ConvocatoriaUncheckedCreateNestedManyWithoutUserInput
    respostas?: RespuestaUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUpdateManyWithoutUserNestedInput
    convocatories?: ConvocatoriaUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUncheckedUpdateManyWithoutUserNestedInput
    convocatories?: ConvocatoriaUncheckedUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleCreateInput = {
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
    user: UserCreateNestedOneWithoutRolesInput
  }

  export type RoleUncheckedCreateInput = {
    id?: number
    nCarnet: string
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type RoleUpdateInput = {
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutRolesNestedInput
  }

  export type RoleUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RoleCreateManyInput = {
    id?: number
    nCarnet: string
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type RoleUpdateManyMutationInput = {
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RoleUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ConvoTypeCreateInput = {
    name: string
    minGrocSortida?: number
    minVerdSortida?: number
    defaultLocation?: string | null
    convocatories?: ConvocatoriaCreateNestedManyWithoutConvoTypeInput
  }

  export type ConvoTypeUncheckedCreateInput = {
    id?: number
    name: string
    minGrocSortida?: number
    minVerdSortida?: number
    defaultLocation?: string | null
    convocatories?: ConvocatoriaUncheckedCreateNestedManyWithoutConvoTypeInput
  }

  export type ConvoTypeUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
    convocatories?: ConvocatoriaUpdateManyWithoutConvoTypeNestedInput
  }

  export type ConvoTypeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
    convocatories?: ConvocatoriaUncheckedUpdateManyWithoutConvoTypeNestedInput
  }

  export type ConvoTypeCreateManyInput = {
    id?: number
    name: string
    minGrocSortida?: number
    minVerdSortida?: number
    defaultLocation?: string | null
  }

  export type ConvoTypeUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConvoTypeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConvocatoriaCreateInput = {
    date: Date | string
    title: string
    ubiSortida: string
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    user: UserCreateNestedOneWithoutConvocatoriesInput
    convoType: ConvoTypeCreateNestedOneWithoutConvocatoriesInput
    respostas?: RespuestaCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaUncheckedCreateInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    responsableId: number
    convoTypeId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    respostas?: RespuestaUncheckedCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutConvocatoriesNestedInput
    convoType?: ConvoTypeUpdateOneRequiredWithoutConvocatoriesNestedInput
    respostas?: RespuestaUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    responsableId?: IntFieldUpdateOperationsInput | number
    convoTypeId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    respostas?: RespuestaUncheckedUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaCreateManyInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    responsableId: number
    convoTypeId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
  }

  export type ConvocatoriaUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ConvocatoriaUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    responsableId?: IntFieldUpdateOperationsInput | number
    convoTypeId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaCreateInput = {
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
    convocatoria: ConvocatoriaCreateNestedOneWithoutRespostasInput
    user: UserCreateNestedOneWithoutRespostasInput
  }

  export type RespuestaUncheckedCreateInput = {
    id?: number
    convoId: number
    userNCarnet: string
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RespuestaUpdateInput = {
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
    convocatoria?: ConvocatoriaUpdateOneRequiredWithoutRespostasNestedInput
    user?: UserUpdateOneRequiredWithoutRespostasNestedInput
  }

  export type RespuestaUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    convoId?: IntFieldUpdateOperationsInput | number
    userNCarnet?: StringFieldUpdateOperationsInput | string
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaCreateManyInput = {
    id?: number
    convoId: number
    userNCarnet: string
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RespuestaUpdateManyMutationInput = {
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    convoId?: IntFieldUpdateOperationsInput | number
    userNCarnet?: StringFieldUpdateOperationsInput | string
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type RoleListRelationFilter = {
    every?: RoleWhereInput
    some?: RoleWhereInput
    none?: RoleWhereInput
  }

  export type ConvocatoriaListRelationFilter = {
    every?: ConvocatoriaWhereInput
    some?: ConvocatoriaWhereInput
    none?: ConvocatoriaWhereInput
  }

  export type RespuestaListRelationFilter = {
    every?: RespuestaWhereInput
    some?: RespuestaWhereInput
    none?: RespuestaWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type RoleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConvocatoriaOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RespuestaOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    nIndicatiu?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    password?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    nIndicatiu?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    password?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    nIndicatiu?: SortOrder
    name?: SortOrder
    lastName?: SortOrder
    password?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type RoleCountOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    isCapOperatiu?: SortOrder
    isCapColla?: SortOrder
    isAdmin?: SortOrder
    isGroc?: SortOrder
  }

  export type RoleAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type RoleMaxOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    isCapOperatiu?: SortOrder
    isCapColla?: SortOrder
    isAdmin?: SortOrder
    isGroc?: SortOrder
  }

  export type RoleMinOrderByAggregateInput = {
    id?: SortOrder
    nCarnet?: SortOrder
    isCapOperatiu?: SortOrder
    isCapColla?: SortOrder
    isAdmin?: SortOrder
    isGroc?: SortOrder
  }

  export type RoleSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type ConvoTypeCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
    defaultLocation?: SortOrder
  }

  export type ConvoTypeAvgOrderByAggregateInput = {
    id?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
  }

  export type ConvoTypeMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
    defaultLocation?: SortOrder
  }

  export type ConvoTypeMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
    defaultLocation?: SortOrder
  }

  export type ConvoTypeSumOrderByAggregateInput = {
    id?: SortOrder
    minGrocSortida?: SortOrder
    minVerdSortida?: SortOrder
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type ConvoTypeRelationFilter = {
    is?: ConvoTypeWhereInput
    isNot?: ConvoTypeWhereInput
  }

  export type ConvocatoriaCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    title?: SortOrder
    ubiSortida?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
    moreThan2?: SortOrder
    startTime?: SortOrder
    finalTime?: SortOrder
    isActive?: SortOrder
    autoAssignResponsable?: SortOrder
    sortida?: SortOrder
  }

  export type ConvocatoriaAvgOrderByAggregateInput = {
    id?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
  }

  export type ConvocatoriaMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    title?: SortOrder
    ubiSortida?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
    moreThan2?: SortOrder
    startTime?: SortOrder
    finalTime?: SortOrder
    isActive?: SortOrder
    autoAssignResponsable?: SortOrder
    sortida?: SortOrder
  }

  export type ConvocatoriaMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    title?: SortOrder
    ubiSortida?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
    moreThan2?: SortOrder
    startTime?: SortOrder
    finalTime?: SortOrder
    isActive?: SortOrder
    autoAssignResponsable?: SortOrder
    sortida?: SortOrder
  }

  export type ConvocatoriaSumOrderByAggregateInput = {
    id?: SortOrder
    responsableId?: SortOrder
    convoTypeId?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ConvocatoriaRelationFilter = {
    is?: ConvocatoriaWhereInput
    isNot?: ConvocatoriaWhereInput
  }

  export type RespuestaCountOrderByAggregateInput = {
    id?: SortOrder
    convoId?: SortOrder
    userNCarnet?: SortOrder
    isCustom?: SortOrder
    customText?: SortOrder
    fullHorari?: SortOrder
    response?: SortOrder
  }

  export type RespuestaAvgOrderByAggregateInput = {
    id?: SortOrder
    convoId?: SortOrder
  }

  export type RespuestaMaxOrderByAggregateInput = {
    id?: SortOrder
    convoId?: SortOrder
    userNCarnet?: SortOrder
    isCustom?: SortOrder
    customText?: SortOrder
    fullHorari?: SortOrder
    response?: SortOrder
  }

  export type RespuestaMinOrderByAggregateInput = {
    id?: SortOrder
    convoId?: SortOrder
    userNCarnet?: SortOrder
    isCustom?: SortOrder
    customText?: SortOrder
    fullHorari?: SortOrder
    response?: SortOrder
  }

  export type RespuestaSumOrderByAggregateInput = {
    id?: SortOrder
    convoId?: SortOrder
  }

  export type RoleCreateNestedManyWithoutUserInput = {
    create?: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput> | RoleCreateWithoutUserInput[] | RoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoleCreateOrConnectWithoutUserInput | RoleCreateOrConnectWithoutUserInput[]
    createMany?: RoleCreateManyUserInputEnvelope
    connect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
  }

  export type ConvocatoriaCreateNestedManyWithoutUserInput = {
    create?: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput> | ConvocatoriaCreateWithoutUserInput[] | ConvocatoriaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutUserInput | ConvocatoriaCreateOrConnectWithoutUserInput[]
    createMany?: ConvocatoriaCreateManyUserInputEnvelope
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
  }

  export type RespuestaCreateNestedManyWithoutUserInput = {
    create?: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput> | RespuestaCreateWithoutUserInput[] | RespuestaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutUserInput | RespuestaCreateOrConnectWithoutUserInput[]
    createMany?: RespuestaCreateManyUserInputEnvelope
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
  }

  export type RoleUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput> | RoleCreateWithoutUserInput[] | RoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoleCreateOrConnectWithoutUserInput | RoleCreateOrConnectWithoutUserInput[]
    createMany?: RoleCreateManyUserInputEnvelope
    connect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
  }

  export type ConvocatoriaUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput> | ConvocatoriaCreateWithoutUserInput[] | ConvocatoriaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutUserInput | ConvocatoriaCreateOrConnectWithoutUserInput[]
    createMany?: ConvocatoriaCreateManyUserInputEnvelope
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
  }

  export type RespuestaUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput> | RespuestaCreateWithoutUserInput[] | RespuestaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutUserInput | RespuestaCreateOrConnectWithoutUserInput[]
    createMany?: RespuestaCreateManyUserInputEnvelope
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type RoleUpdateManyWithoutUserNestedInput = {
    create?: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput> | RoleCreateWithoutUserInput[] | RoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoleCreateOrConnectWithoutUserInput | RoleCreateOrConnectWithoutUserInput[]
    upsert?: RoleUpsertWithWhereUniqueWithoutUserInput | RoleUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RoleCreateManyUserInputEnvelope
    set?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    disconnect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    delete?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    connect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    update?: RoleUpdateWithWhereUniqueWithoutUserInput | RoleUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RoleUpdateManyWithWhereWithoutUserInput | RoleUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RoleScalarWhereInput | RoleScalarWhereInput[]
  }

  export type ConvocatoriaUpdateManyWithoutUserNestedInput = {
    create?: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput> | ConvocatoriaCreateWithoutUserInput[] | ConvocatoriaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutUserInput | ConvocatoriaCreateOrConnectWithoutUserInput[]
    upsert?: ConvocatoriaUpsertWithWhereUniqueWithoutUserInput | ConvocatoriaUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ConvocatoriaCreateManyUserInputEnvelope
    set?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    disconnect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    delete?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    update?: ConvocatoriaUpdateWithWhereUniqueWithoutUserInput | ConvocatoriaUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ConvocatoriaUpdateManyWithWhereWithoutUserInput | ConvocatoriaUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
  }

  export type RespuestaUpdateManyWithoutUserNestedInput = {
    create?: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput> | RespuestaCreateWithoutUserInput[] | RespuestaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutUserInput | RespuestaCreateOrConnectWithoutUserInput[]
    upsert?: RespuestaUpsertWithWhereUniqueWithoutUserInput | RespuestaUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RespuestaCreateManyUserInputEnvelope
    set?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    disconnect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    delete?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    update?: RespuestaUpdateWithWhereUniqueWithoutUserInput | RespuestaUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RespuestaUpdateManyWithWhereWithoutUserInput | RespuestaUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type RoleUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput> | RoleCreateWithoutUserInput[] | RoleUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RoleCreateOrConnectWithoutUserInput | RoleCreateOrConnectWithoutUserInput[]
    upsert?: RoleUpsertWithWhereUniqueWithoutUserInput | RoleUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RoleCreateManyUserInputEnvelope
    set?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    disconnect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    delete?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    connect?: RoleWhereUniqueInput | RoleWhereUniqueInput[]
    update?: RoleUpdateWithWhereUniqueWithoutUserInput | RoleUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RoleUpdateManyWithWhereWithoutUserInput | RoleUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RoleScalarWhereInput | RoleScalarWhereInput[]
  }

  export type ConvocatoriaUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput> | ConvocatoriaCreateWithoutUserInput[] | ConvocatoriaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutUserInput | ConvocatoriaCreateOrConnectWithoutUserInput[]
    upsert?: ConvocatoriaUpsertWithWhereUniqueWithoutUserInput | ConvocatoriaUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ConvocatoriaCreateManyUserInputEnvelope
    set?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    disconnect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    delete?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    update?: ConvocatoriaUpdateWithWhereUniqueWithoutUserInput | ConvocatoriaUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ConvocatoriaUpdateManyWithWhereWithoutUserInput | ConvocatoriaUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
  }

  export type RespuestaUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput> | RespuestaCreateWithoutUserInput[] | RespuestaUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutUserInput | RespuestaCreateOrConnectWithoutUserInput[]
    upsert?: RespuestaUpsertWithWhereUniqueWithoutUserInput | RespuestaUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RespuestaCreateManyUserInputEnvelope
    set?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    disconnect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    delete?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    update?: RespuestaUpdateWithWhereUniqueWithoutUserInput | RespuestaUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RespuestaUpdateManyWithWhereWithoutUserInput | RespuestaUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRolesInput = {
    create?: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRolesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRolesNestedInput = {
    create?: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    connectOrCreate?: UserCreateOrConnectWithoutRolesInput
    upsert?: UserUpsertWithoutRolesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRolesInput, UserUpdateWithoutRolesInput>, UserUncheckedUpdateWithoutRolesInput>
  }

  export type ConvocatoriaCreateNestedManyWithoutConvoTypeInput = {
    create?: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput> | ConvocatoriaCreateWithoutConvoTypeInput[] | ConvocatoriaUncheckedCreateWithoutConvoTypeInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutConvoTypeInput | ConvocatoriaCreateOrConnectWithoutConvoTypeInput[]
    createMany?: ConvocatoriaCreateManyConvoTypeInputEnvelope
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
  }

  export type ConvocatoriaUncheckedCreateNestedManyWithoutConvoTypeInput = {
    create?: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput> | ConvocatoriaCreateWithoutConvoTypeInput[] | ConvocatoriaUncheckedCreateWithoutConvoTypeInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutConvoTypeInput | ConvocatoriaCreateOrConnectWithoutConvoTypeInput[]
    createMany?: ConvocatoriaCreateManyConvoTypeInputEnvelope
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
  }

  export type ConvocatoriaUpdateManyWithoutConvoTypeNestedInput = {
    create?: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput> | ConvocatoriaCreateWithoutConvoTypeInput[] | ConvocatoriaUncheckedCreateWithoutConvoTypeInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutConvoTypeInput | ConvocatoriaCreateOrConnectWithoutConvoTypeInput[]
    upsert?: ConvocatoriaUpsertWithWhereUniqueWithoutConvoTypeInput | ConvocatoriaUpsertWithWhereUniqueWithoutConvoTypeInput[]
    createMany?: ConvocatoriaCreateManyConvoTypeInputEnvelope
    set?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    disconnect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    delete?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    update?: ConvocatoriaUpdateWithWhereUniqueWithoutConvoTypeInput | ConvocatoriaUpdateWithWhereUniqueWithoutConvoTypeInput[]
    updateMany?: ConvocatoriaUpdateManyWithWhereWithoutConvoTypeInput | ConvocatoriaUpdateManyWithWhereWithoutConvoTypeInput[]
    deleteMany?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
  }

  export type ConvocatoriaUncheckedUpdateManyWithoutConvoTypeNestedInput = {
    create?: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput> | ConvocatoriaCreateWithoutConvoTypeInput[] | ConvocatoriaUncheckedCreateWithoutConvoTypeInput[]
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutConvoTypeInput | ConvocatoriaCreateOrConnectWithoutConvoTypeInput[]
    upsert?: ConvocatoriaUpsertWithWhereUniqueWithoutConvoTypeInput | ConvocatoriaUpsertWithWhereUniqueWithoutConvoTypeInput[]
    createMany?: ConvocatoriaCreateManyConvoTypeInputEnvelope
    set?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    disconnect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    delete?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    connect?: ConvocatoriaWhereUniqueInput | ConvocatoriaWhereUniqueInput[]
    update?: ConvocatoriaUpdateWithWhereUniqueWithoutConvoTypeInput | ConvocatoriaUpdateWithWhereUniqueWithoutConvoTypeInput[]
    updateMany?: ConvocatoriaUpdateManyWithWhereWithoutConvoTypeInput | ConvocatoriaUpdateManyWithWhereWithoutConvoTypeInput[]
    deleteMany?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutConvocatoriesInput = {
    create?: XOR<UserCreateWithoutConvocatoriesInput, UserUncheckedCreateWithoutConvocatoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutConvocatoriesInput
    connect?: UserWhereUniqueInput
  }

  export type ConvoTypeCreateNestedOneWithoutConvocatoriesInput = {
    create?: XOR<ConvoTypeCreateWithoutConvocatoriesInput, ConvoTypeUncheckedCreateWithoutConvocatoriesInput>
    connectOrCreate?: ConvoTypeCreateOrConnectWithoutConvocatoriesInput
    connect?: ConvoTypeWhereUniqueInput
  }

  export type RespuestaCreateNestedManyWithoutConvocatoriaInput = {
    create?: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput> | RespuestaCreateWithoutConvocatoriaInput[] | RespuestaUncheckedCreateWithoutConvocatoriaInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutConvocatoriaInput | RespuestaCreateOrConnectWithoutConvocatoriaInput[]
    createMany?: RespuestaCreateManyConvocatoriaInputEnvelope
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
  }

  export type RespuestaUncheckedCreateNestedManyWithoutConvocatoriaInput = {
    create?: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput> | RespuestaCreateWithoutConvocatoriaInput[] | RespuestaUncheckedCreateWithoutConvocatoriaInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutConvocatoriaInput | RespuestaCreateOrConnectWithoutConvocatoriaInput[]
    createMany?: RespuestaCreateManyConvocatoriaInputEnvelope
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutConvocatoriesNestedInput = {
    create?: XOR<UserCreateWithoutConvocatoriesInput, UserUncheckedCreateWithoutConvocatoriesInput>
    connectOrCreate?: UserCreateOrConnectWithoutConvocatoriesInput
    upsert?: UserUpsertWithoutConvocatoriesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutConvocatoriesInput, UserUpdateWithoutConvocatoriesInput>, UserUncheckedUpdateWithoutConvocatoriesInput>
  }

  export type ConvoTypeUpdateOneRequiredWithoutConvocatoriesNestedInput = {
    create?: XOR<ConvoTypeCreateWithoutConvocatoriesInput, ConvoTypeUncheckedCreateWithoutConvocatoriesInput>
    connectOrCreate?: ConvoTypeCreateOrConnectWithoutConvocatoriesInput
    upsert?: ConvoTypeUpsertWithoutConvocatoriesInput
    connect?: ConvoTypeWhereUniqueInput
    update?: XOR<XOR<ConvoTypeUpdateToOneWithWhereWithoutConvocatoriesInput, ConvoTypeUpdateWithoutConvocatoriesInput>, ConvoTypeUncheckedUpdateWithoutConvocatoriesInput>
  }

  export type RespuestaUpdateManyWithoutConvocatoriaNestedInput = {
    create?: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput> | RespuestaCreateWithoutConvocatoriaInput[] | RespuestaUncheckedCreateWithoutConvocatoriaInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutConvocatoriaInput | RespuestaCreateOrConnectWithoutConvocatoriaInput[]
    upsert?: RespuestaUpsertWithWhereUniqueWithoutConvocatoriaInput | RespuestaUpsertWithWhereUniqueWithoutConvocatoriaInput[]
    createMany?: RespuestaCreateManyConvocatoriaInputEnvelope
    set?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    disconnect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    delete?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    update?: RespuestaUpdateWithWhereUniqueWithoutConvocatoriaInput | RespuestaUpdateWithWhereUniqueWithoutConvocatoriaInput[]
    updateMany?: RespuestaUpdateManyWithWhereWithoutConvocatoriaInput | RespuestaUpdateManyWithWhereWithoutConvocatoriaInput[]
    deleteMany?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
  }

  export type RespuestaUncheckedUpdateManyWithoutConvocatoriaNestedInput = {
    create?: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput> | RespuestaCreateWithoutConvocatoriaInput[] | RespuestaUncheckedCreateWithoutConvocatoriaInput[]
    connectOrCreate?: RespuestaCreateOrConnectWithoutConvocatoriaInput | RespuestaCreateOrConnectWithoutConvocatoriaInput[]
    upsert?: RespuestaUpsertWithWhereUniqueWithoutConvocatoriaInput | RespuestaUpsertWithWhereUniqueWithoutConvocatoriaInput[]
    createMany?: RespuestaCreateManyConvocatoriaInputEnvelope
    set?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    disconnect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    delete?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    connect?: RespuestaWhereUniqueInput | RespuestaWhereUniqueInput[]
    update?: RespuestaUpdateWithWhereUniqueWithoutConvocatoriaInput | RespuestaUpdateWithWhereUniqueWithoutConvocatoriaInput[]
    updateMany?: RespuestaUpdateManyWithWhereWithoutConvocatoriaInput | RespuestaUpdateManyWithWhereWithoutConvocatoriaInput[]
    deleteMany?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
  }

  export type ConvocatoriaCreateNestedOneWithoutRespostasInput = {
    create?: XOR<ConvocatoriaCreateWithoutRespostasInput, ConvocatoriaUncheckedCreateWithoutRespostasInput>
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutRespostasInput
    connect?: ConvocatoriaWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutRespostasInput = {
    create?: XOR<UserCreateWithoutRespostasInput, UserUncheckedCreateWithoutRespostasInput>
    connectOrCreate?: UserCreateOrConnectWithoutRespostasInput
    connect?: UserWhereUniqueInput
  }

  export type ConvocatoriaUpdateOneRequiredWithoutRespostasNestedInput = {
    create?: XOR<ConvocatoriaCreateWithoutRespostasInput, ConvocatoriaUncheckedCreateWithoutRespostasInput>
    connectOrCreate?: ConvocatoriaCreateOrConnectWithoutRespostasInput
    upsert?: ConvocatoriaUpsertWithoutRespostasInput
    connect?: ConvocatoriaWhereUniqueInput
    update?: XOR<XOR<ConvocatoriaUpdateToOneWithWhereWithoutRespostasInput, ConvocatoriaUpdateWithoutRespostasInput>, ConvocatoriaUncheckedUpdateWithoutRespostasInput>
  }

  export type UserUpdateOneRequiredWithoutRespostasNestedInput = {
    create?: XOR<UserCreateWithoutRespostasInput, UserUncheckedCreateWithoutRespostasInput>
    connectOrCreate?: UserCreateOrConnectWithoutRespostasInput
    upsert?: UserUpsertWithoutRespostasInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRespostasInput, UserUpdateWithoutRespostasInput>, UserUncheckedUpdateWithoutRespostasInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type RoleCreateWithoutUserInput = {
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type RoleUncheckedCreateWithoutUserInput = {
    id?: number
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type RoleCreateOrConnectWithoutUserInput = {
    where: RoleWhereUniqueInput
    create: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput>
  }

  export type RoleCreateManyUserInputEnvelope = {
    data: RoleCreateManyUserInput | RoleCreateManyUserInput[]
  }

  export type ConvocatoriaCreateWithoutUserInput = {
    date: Date | string
    title: string
    ubiSortida: string
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    convoType: ConvoTypeCreateNestedOneWithoutConvocatoriesInput
    respostas?: RespuestaCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaUncheckedCreateWithoutUserInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    convoTypeId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    respostas?: RespuestaUncheckedCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaCreateOrConnectWithoutUserInput = {
    where: ConvocatoriaWhereUniqueInput
    create: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput>
  }

  export type ConvocatoriaCreateManyUserInputEnvelope = {
    data: ConvocatoriaCreateManyUserInput | ConvocatoriaCreateManyUserInput[]
  }

  export type RespuestaCreateWithoutUserInput = {
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
    convocatoria: ConvocatoriaCreateNestedOneWithoutRespostasInput
  }

  export type RespuestaUncheckedCreateWithoutUserInput = {
    id?: number
    convoId: number
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RespuestaCreateOrConnectWithoutUserInput = {
    where: RespuestaWhereUniqueInput
    create: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput>
  }

  export type RespuestaCreateManyUserInputEnvelope = {
    data: RespuestaCreateManyUserInput | RespuestaCreateManyUserInput[]
  }

  export type RoleUpsertWithWhereUniqueWithoutUserInput = {
    where: RoleWhereUniqueInput
    update: XOR<RoleUpdateWithoutUserInput, RoleUncheckedUpdateWithoutUserInput>
    create: XOR<RoleCreateWithoutUserInput, RoleUncheckedCreateWithoutUserInput>
  }

  export type RoleUpdateWithWhereUniqueWithoutUserInput = {
    where: RoleWhereUniqueInput
    data: XOR<RoleUpdateWithoutUserInput, RoleUncheckedUpdateWithoutUserInput>
  }

  export type RoleUpdateManyWithWhereWithoutUserInput = {
    where: RoleScalarWhereInput
    data: XOR<RoleUpdateManyMutationInput, RoleUncheckedUpdateManyWithoutUserInput>
  }

  export type RoleScalarWhereInput = {
    AND?: RoleScalarWhereInput | RoleScalarWhereInput[]
    OR?: RoleScalarWhereInput[]
    NOT?: RoleScalarWhereInput | RoleScalarWhereInput[]
    id?: IntFilter<"Role"> | number
    nCarnet?: StringFilter<"Role"> | string
    isCapOperatiu?: BoolFilter<"Role"> | boolean
    isCapColla?: BoolFilter<"Role"> | boolean
    isAdmin?: BoolFilter<"Role"> | boolean
    isGroc?: BoolFilter<"Role"> | boolean
  }

  export type ConvocatoriaUpsertWithWhereUniqueWithoutUserInput = {
    where: ConvocatoriaWhereUniqueInput
    update: XOR<ConvocatoriaUpdateWithoutUserInput, ConvocatoriaUncheckedUpdateWithoutUserInput>
    create: XOR<ConvocatoriaCreateWithoutUserInput, ConvocatoriaUncheckedCreateWithoutUserInput>
  }

  export type ConvocatoriaUpdateWithWhereUniqueWithoutUserInput = {
    where: ConvocatoriaWhereUniqueInput
    data: XOR<ConvocatoriaUpdateWithoutUserInput, ConvocatoriaUncheckedUpdateWithoutUserInput>
  }

  export type ConvocatoriaUpdateManyWithWhereWithoutUserInput = {
    where: ConvocatoriaScalarWhereInput
    data: XOR<ConvocatoriaUpdateManyMutationInput, ConvocatoriaUncheckedUpdateManyWithoutUserInput>
  }

  export type ConvocatoriaScalarWhereInput = {
    AND?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
    OR?: ConvocatoriaScalarWhereInput[]
    NOT?: ConvocatoriaScalarWhereInput | ConvocatoriaScalarWhereInput[]
    id?: IntFilter<"Convocatoria"> | number
    date?: DateTimeFilter<"Convocatoria"> | Date | string
    title?: StringFilter<"Convocatoria"> | string
    ubiSortida?: StringFilter<"Convocatoria"> | string
    responsableId?: IntFilter<"Convocatoria"> | number
    convoTypeId?: IntFilter<"Convocatoria"> | number
    moreThan2?: BoolFilter<"Convocatoria"> | boolean
    startTime?: DateTimeFilter<"Convocatoria"> | Date | string
    finalTime?: DateTimeNullableFilter<"Convocatoria"> | Date | string | null
    isActive?: BoolFilter<"Convocatoria"> | boolean
    autoAssignResponsable?: BoolFilter<"Convocatoria"> | boolean
    sortida?: BoolFilter<"Convocatoria"> | boolean
  }

  export type RespuestaUpsertWithWhereUniqueWithoutUserInput = {
    where: RespuestaWhereUniqueInput
    update: XOR<RespuestaUpdateWithoutUserInput, RespuestaUncheckedUpdateWithoutUserInput>
    create: XOR<RespuestaCreateWithoutUserInput, RespuestaUncheckedCreateWithoutUserInput>
  }

  export type RespuestaUpdateWithWhereUniqueWithoutUserInput = {
    where: RespuestaWhereUniqueInput
    data: XOR<RespuestaUpdateWithoutUserInput, RespuestaUncheckedUpdateWithoutUserInput>
  }

  export type RespuestaUpdateManyWithWhereWithoutUserInput = {
    where: RespuestaScalarWhereInput
    data: XOR<RespuestaUpdateManyMutationInput, RespuestaUncheckedUpdateManyWithoutUserInput>
  }

  export type RespuestaScalarWhereInput = {
    AND?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
    OR?: RespuestaScalarWhereInput[]
    NOT?: RespuestaScalarWhereInput | RespuestaScalarWhereInput[]
    id?: IntFilter<"Respuesta"> | number
    convoId?: IntFilter<"Respuesta"> | number
    userNCarnet?: StringFilter<"Respuesta"> | string
    isCustom?: BoolFilter<"Respuesta"> | boolean
    customText?: StringNullableFilter<"Respuesta"> | string | null
    fullHorari?: BoolFilter<"Respuesta"> | boolean
    response?: BoolFilter<"Respuesta"> | boolean
  }

  export type UserCreateWithoutRolesInput = {
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    convocatories?: ConvocatoriaCreateNestedManyWithoutUserInput
    respostas?: RespuestaCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRolesInput = {
    id?: number
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    convocatories?: ConvocatoriaUncheckedCreateNestedManyWithoutUserInput
    respostas?: RespuestaUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRolesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
  }

  export type UserUpsertWithoutRolesInput = {
    update: XOR<UserUpdateWithoutRolesInput, UserUncheckedUpdateWithoutRolesInput>
    create: XOR<UserCreateWithoutRolesInput, UserUncheckedCreateWithoutRolesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRolesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRolesInput, UserUncheckedUpdateWithoutRolesInput>
  }

  export type UserUpdateWithoutRolesInput = {
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    convocatories?: ConvocatoriaUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRolesInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    convocatories?: ConvocatoriaUncheckedUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ConvocatoriaCreateWithoutConvoTypeInput = {
    date: Date | string
    title: string
    ubiSortida: string
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    user: UserCreateNestedOneWithoutConvocatoriesInput
    respostas?: RespuestaCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaUncheckedCreateWithoutConvoTypeInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    responsableId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    respostas?: RespuestaUncheckedCreateNestedManyWithoutConvocatoriaInput
  }

  export type ConvocatoriaCreateOrConnectWithoutConvoTypeInput = {
    where: ConvocatoriaWhereUniqueInput
    create: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput>
  }

  export type ConvocatoriaCreateManyConvoTypeInputEnvelope = {
    data: ConvocatoriaCreateManyConvoTypeInput | ConvocatoriaCreateManyConvoTypeInput[]
  }

  export type ConvocatoriaUpsertWithWhereUniqueWithoutConvoTypeInput = {
    where: ConvocatoriaWhereUniqueInput
    update: XOR<ConvocatoriaUpdateWithoutConvoTypeInput, ConvocatoriaUncheckedUpdateWithoutConvoTypeInput>
    create: XOR<ConvocatoriaCreateWithoutConvoTypeInput, ConvocatoriaUncheckedCreateWithoutConvoTypeInput>
  }

  export type ConvocatoriaUpdateWithWhereUniqueWithoutConvoTypeInput = {
    where: ConvocatoriaWhereUniqueInput
    data: XOR<ConvocatoriaUpdateWithoutConvoTypeInput, ConvocatoriaUncheckedUpdateWithoutConvoTypeInput>
  }

  export type ConvocatoriaUpdateManyWithWhereWithoutConvoTypeInput = {
    where: ConvocatoriaScalarWhereInput
    data: XOR<ConvocatoriaUpdateManyMutationInput, ConvocatoriaUncheckedUpdateManyWithoutConvoTypeInput>
  }

  export type UserCreateWithoutConvocatoriesInput = {
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleCreateNestedManyWithoutUserInput
    respostas?: RespuestaCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutConvocatoriesInput = {
    id?: number
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleUncheckedCreateNestedManyWithoutUserInput
    respostas?: RespuestaUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutConvocatoriesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutConvocatoriesInput, UserUncheckedCreateWithoutConvocatoriesInput>
  }

  export type ConvoTypeCreateWithoutConvocatoriesInput = {
    name: string
    minGrocSortida?: number
    minVerdSortida?: number
    defaultLocation?: string | null
  }

  export type ConvoTypeUncheckedCreateWithoutConvocatoriesInput = {
    id?: number
    name: string
    minGrocSortida?: number
    minVerdSortida?: number
    defaultLocation?: string | null
  }

  export type ConvoTypeCreateOrConnectWithoutConvocatoriesInput = {
    where: ConvoTypeWhereUniqueInput
    create: XOR<ConvoTypeCreateWithoutConvocatoriesInput, ConvoTypeUncheckedCreateWithoutConvocatoriesInput>
  }

  export type RespuestaCreateWithoutConvocatoriaInput = {
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
    user: UserCreateNestedOneWithoutRespostasInput
  }

  export type RespuestaUncheckedCreateWithoutConvocatoriaInput = {
    id?: number
    userNCarnet: string
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RespuestaCreateOrConnectWithoutConvocatoriaInput = {
    where: RespuestaWhereUniqueInput
    create: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput>
  }

  export type RespuestaCreateManyConvocatoriaInputEnvelope = {
    data: RespuestaCreateManyConvocatoriaInput | RespuestaCreateManyConvocatoriaInput[]
  }

  export type UserUpsertWithoutConvocatoriesInput = {
    update: XOR<UserUpdateWithoutConvocatoriesInput, UserUncheckedUpdateWithoutConvocatoriesInput>
    create: XOR<UserCreateWithoutConvocatoriesInput, UserUncheckedCreateWithoutConvocatoriesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutConvocatoriesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutConvocatoriesInput, UserUncheckedUpdateWithoutConvocatoriesInput>
  }

  export type UserUpdateWithoutConvocatoriesInput = {
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutConvocatoriesInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUncheckedUpdateManyWithoutUserNestedInput
    respostas?: RespuestaUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ConvoTypeUpsertWithoutConvocatoriesInput = {
    update: XOR<ConvoTypeUpdateWithoutConvocatoriesInput, ConvoTypeUncheckedUpdateWithoutConvocatoriesInput>
    create: XOR<ConvoTypeCreateWithoutConvocatoriesInput, ConvoTypeUncheckedCreateWithoutConvocatoriesInput>
    where?: ConvoTypeWhereInput
  }

  export type ConvoTypeUpdateToOneWithWhereWithoutConvocatoriesInput = {
    where?: ConvoTypeWhereInput
    data: XOR<ConvoTypeUpdateWithoutConvocatoriesInput, ConvoTypeUncheckedUpdateWithoutConvocatoriesInput>
  }

  export type ConvoTypeUpdateWithoutConvocatoriesInput = {
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ConvoTypeUncheckedUpdateWithoutConvocatoriesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    minGrocSortida?: IntFieldUpdateOperationsInput | number
    minVerdSortida?: IntFieldUpdateOperationsInput | number
    defaultLocation?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RespuestaUpsertWithWhereUniqueWithoutConvocatoriaInput = {
    where: RespuestaWhereUniqueInput
    update: XOR<RespuestaUpdateWithoutConvocatoriaInput, RespuestaUncheckedUpdateWithoutConvocatoriaInput>
    create: XOR<RespuestaCreateWithoutConvocatoriaInput, RespuestaUncheckedCreateWithoutConvocatoriaInput>
  }

  export type RespuestaUpdateWithWhereUniqueWithoutConvocatoriaInput = {
    where: RespuestaWhereUniqueInput
    data: XOR<RespuestaUpdateWithoutConvocatoriaInput, RespuestaUncheckedUpdateWithoutConvocatoriaInput>
  }

  export type RespuestaUpdateManyWithWhereWithoutConvocatoriaInput = {
    where: RespuestaScalarWhereInput
    data: XOR<RespuestaUpdateManyMutationInput, RespuestaUncheckedUpdateManyWithoutConvocatoriaInput>
  }

  export type ConvocatoriaCreateWithoutRespostasInput = {
    date: Date | string
    title: string
    ubiSortida: string
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
    user: UserCreateNestedOneWithoutConvocatoriesInput
    convoType: ConvoTypeCreateNestedOneWithoutConvocatoriesInput
  }

  export type ConvocatoriaUncheckedCreateWithoutRespostasInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    responsableId: number
    convoTypeId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
  }

  export type ConvocatoriaCreateOrConnectWithoutRespostasInput = {
    where: ConvocatoriaWhereUniqueInput
    create: XOR<ConvocatoriaCreateWithoutRespostasInput, ConvocatoriaUncheckedCreateWithoutRespostasInput>
  }

  export type UserCreateWithoutRespostasInput = {
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleCreateNestedManyWithoutUserInput
    convocatories?: ConvocatoriaCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRespostasInput = {
    id?: number
    nCarnet: string
    nIndicatiu?: string | null
    name: string
    lastName?: string | null
    password: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    roles?: RoleUncheckedCreateNestedManyWithoutUserInput
    convocatories?: ConvocatoriaUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRespostasInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRespostasInput, UserUncheckedCreateWithoutRespostasInput>
  }

  export type ConvocatoriaUpsertWithoutRespostasInput = {
    update: XOR<ConvocatoriaUpdateWithoutRespostasInput, ConvocatoriaUncheckedUpdateWithoutRespostasInput>
    create: XOR<ConvocatoriaCreateWithoutRespostasInput, ConvocatoriaUncheckedCreateWithoutRespostasInput>
    where?: ConvocatoriaWhereInput
  }

  export type ConvocatoriaUpdateToOneWithWhereWithoutRespostasInput = {
    where?: ConvocatoriaWhereInput
    data: XOR<ConvocatoriaUpdateWithoutRespostasInput, ConvocatoriaUncheckedUpdateWithoutRespostasInput>
  }

  export type ConvocatoriaUpdateWithoutRespostasInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutConvocatoriesNestedInput
    convoType?: ConvoTypeUpdateOneRequiredWithoutConvocatoriesNestedInput
  }

  export type ConvocatoriaUncheckedUpdateWithoutRespostasInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    responsableId?: IntFieldUpdateOperationsInput | number
    convoTypeId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserUpsertWithoutRespostasInput = {
    update: XOR<UserUpdateWithoutRespostasInput, UserUncheckedUpdateWithoutRespostasInput>
    create: XOR<UserCreateWithoutRespostasInput, UserUncheckedCreateWithoutRespostasInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRespostasInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRespostasInput, UserUncheckedUpdateWithoutRespostasInput>
  }

  export type UserUpdateWithoutRespostasInput = {
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUpdateManyWithoutUserNestedInput
    convocatories?: ConvocatoriaUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRespostasInput = {
    id?: IntFieldUpdateOperationsInput | number
    nCarnet?: StringFieldUpdateOperationsInput | string
    nIndicatiu?: NullableStringFieldUpdateOperationsInput | string | null
    name?: StringFieldUpdateOperationsInput | string
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    roles?: RoleUncheckedUpdateManyWithoutUserNestedInput
    convocatories?: ConvocatoriaUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RoleCreateManyUserInput = {
    id?: number
    isCapOperatiu?: boolean
    isCapColla?: boolean
    isAdmin?: boolean
    isGroc?: boolean
  }

  export type ConvocatoriaCreateManyUserInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    convoTypeId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
  }

  export type RespuestaCreateManyUserInput = {
    id?: number
    convoId: number
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RoleUpdateWithoutUserInput = {
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RoleUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RoleUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    isCapOperatiu?: BoolFieldUpdateOperationsInput | boolean
    isCapColla?: BoolFieldUpdateOperationsInput | boolean
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isGroc?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ConvocatoriaUpdateWithoutUserInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    convoType?: ConvoTypeUpdateOneRequiredWithoutConvocatoriesNestedInput
    respostas?: RespuestaUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    convoTypeId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    respostas?: RespuestaUncheckedUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    convoTypeId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaUpdateWithoutUserInput = {
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
    convocatoria?: ConvocatoriaUpdateOneRequiredWithoutRespostasNestedInput
  }

  export type RespuestaUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    convoId?: IntFieldUpdateOperationsInput | number
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    convoId?: IntFieldUpdateOperationsInput | number
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type ConvocatoriaCreateManyConvoTypeInput = {
    id?: number
    date: Date | string
    title: string
    ubiSortida: string
    responsableId: number
    moreThan2?: boolean
    startTime: Date | string
    finalTime?: Date | string | null
    isActive?: boolean
    autoAssignResponsable?: boolean
    sortida?: boolean
  }

  export type ConvocatoriaUpdateWithoutConvoTypeInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutConvocatoriesNestedInput
    respostas?: RespuestaUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaUncheckedUpdateWithoutConvoTypeInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    responsableId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
    respostas?: RespuestaUncheckedUpdateManyWithoutConvocatoriaNestedInput
  }

  export type ConvocatoriaUncheckedUpdateManyWithoutConvoTypeInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: StringFieldUpdateOperationsInput | string
    ubiSortida?: StringFieldUpdateOperationsInput | string
    responsableId?: IntFieldUpdateOperationsInput | number
    moreThan2?: BoolFieldUpdateOperationsInput | boolean
    startTime?: DateTimeFieldUpdateOperationsInput | Date | string
    finalTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    autoAssignResponsable?: BoolFieldUpdateOperationsInput | boolean
    sortida?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaCreateManyConvocatoriaInput = {
    id?: number
    userNCarnet: string
    isCustom?: boolean
    customText?: string | null
    fullHorari?: boolean
    response: boolean
  }

  export type RespuestaUpdateWithoutConvocatoriaInput = {
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutRespostasNestedInput
  }

  export type RespuestaUncheckedUpdateWithoutConvocatoriaInput = {
    id?: IntFieldUpdateOperationsInput | number
    userNCarnet?: StringFieldUpdateOperationsInput | string
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }

  export type RespuestaUncheckedUpdateManyWithoutConvocatoriaInput = {
    id?: IntFieldUpdateOperationsInput | number
    userNCarnet?: StringFieldUpdateOperationsInput | string
    isCustom?: BoolFieldUpdateOperationsInput | boolean
    customText?: NullableStringFieldUpdateOperationsInput | string | null
    fullHorari?: BoolFieldUpdateOperationsInput | boolean
    response?: BoolFieldUpdateOperationsInput | boolean
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConvoTypeCountOutputTypeDefaultArgs instead
     */
    export type ConvoTypeCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConvoTypeCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConvocatoriaCountOutputTypeDefaultArgs instead
     */
    export type ConvocatoriaCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConvocatoriaCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RoleDefaultArgs instead
     */
    export type RoleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RoleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConvoTypeDefaultArgs instead
     */
    export type ConvoTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConvoTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ConvocatoriaDefaultArgs instead
     */
    export type ConvocatoriaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ConvocatoriaDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RespuestaDefaultArgs instead
     */
    export type RespuestaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RespuestaDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}