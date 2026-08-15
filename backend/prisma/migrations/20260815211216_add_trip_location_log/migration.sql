-- CreateTable
CREATE TABLE "trip_location_log" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "recorded_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_location_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_location_log_trip_id_recorded_at_idx" ON "trip_location_log"("trip_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "trip_location_log" ADD CONSTRAINT "trip_location_log_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_location_log" ADD CONSTRAINT "trip_location_log_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
