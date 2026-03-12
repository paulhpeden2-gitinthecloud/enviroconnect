/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as endorsements_mutations from "../endorsements/mutations.js";
import type * as endorsements_queries from "../endorsements/queries.js";
import type * as http from "../http.js";
import type * as meetings_mutations from "../meetings/mutations.js";
import type * as meetings_queries from "../meetings/queries.js";
import type * as messaging_mutations from "../messaging/mutations.js";
import type * as messaging_queries from "../messaging/queries.js";
import type * as rfq_mutations from "../rfq/mutations.js";
import type * as rfq_queries from "../rfq/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as vendors_mutations from "../vendors/mutations.js";
import type * as vendors_queries from "../vendors/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "endorsements/mutations": typeof endorsements_mutations;
  "endorsements/queries": typeof endorsements_queries;
  http: typeof http;
  "meetings/mutations": typeof meetings_mutations;
  "meetings/queries": typeof meetings_queries;
  "messaging/mutations": typeof messaging_mutations;
  "messaging/queries": typeof messaging_queries;
  "rfq/mutations": typeof rfq_mutations;
  "rfq/queries": typeof rfq_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "vendors/mutations": typeof vendors_mutations;
  "vendors/queries": typeof vendors_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
