-- CreateTable
CREATE TABLE "user_device_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fcm_token" VARCHAR(512) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_device_token_user_id_idx" ON "user_device_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_device_token_user_id_fcm_token_key" ON "user_device_token"("user_id", "fcm_token");

-- AddForeignKey
ALTER TABLE "user_device_token" ADD CONSTRAINT "user_device_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
