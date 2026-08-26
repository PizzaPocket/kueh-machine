-- CreateTable
CREATE TABLE "DeviceEra" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearStart" INTEGER NOT NULL,
    "yearEnd" INTEGER NOT NULL,
    "countryCode" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,

    CONSTRAINT "DeviceEra_pkey" PRIMARY KEY ("id")
);
