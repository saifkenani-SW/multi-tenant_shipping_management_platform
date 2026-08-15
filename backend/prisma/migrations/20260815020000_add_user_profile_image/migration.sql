-- Avatar for every login type.
--
-- It goes on "users" rather than on each profile table because "users" is the
-- only table every login type has a row in. A tenant admin has no profile
-- table at all, so putting the column anywhere else would have left that type
-- with nowhere to store one.
--
-- Purely additive: a nullable column, no data touched.
ALTER TABLE "users" ADD COLUMN "profile_image_key" VARCHAR(500);
