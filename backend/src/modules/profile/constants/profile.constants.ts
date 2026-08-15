export const PROFILE_AVATAR = {
  /** Storage category avatars are filed under. */
  CATEGORY: 'avatars',

  /** Largest avatar accepted, in bytes. */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,

  /**
   * The path a client fetches an avatar from.
   *
   * A stable path per user rather than a signed or hashed one, so a client can
   * build it from a user id it already holds without another round trip.
   */
  urlFor: (userId: string): string => `/me/avatar/${userId}`,
} as const;
