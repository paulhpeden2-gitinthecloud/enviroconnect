/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as endorsementMutations from "../endorsementMutations.js";
import type * as endorsements from "../endorsements.js";
import type * as http from "../http.js";
import type * as meetingMutations from "../meetingMutations.js";
import type * as meetings from "../meetings.js";
import type * as messaging from "../messaging.js";
import type * as messagingMutations from "../messagingMutations.js";
import type * as mutations from "../mutations.js";
import type * as rfqMutations from "../rfqMutations.js";
import type * as rfqs from "../rfqs.js";
import type * as users from "../users.js";
import type * as vendors from "../vendors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  endorsementMutations: typeof endorsementMutations;
  endorsements: typeof endorsements;
  http: typeof http;
  meetingMutations: typeof meetingMutations;
  meetings: typeof meetings;
  messaging: typeof messaging;
  messagingMutations: typeof messagingMutations;
  mutations: typeof mutations;
  rfqMutations: typeof rfqMutations;
  rfqs: typeof rfqs;
  users: typeof users;
  vendors: typeof vendors;
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
