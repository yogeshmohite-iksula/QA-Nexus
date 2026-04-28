-- DropForeignKey
ALTER TABLE "auth_account" DROP CONSTRAINT "auth_account_userId_fkey";

-- DropForeignKey
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_userId_fkey";



-- AlterTable
ALTER TABLE "auth_account" DROP CONSTRAINT "auth_account_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_user" DROP CONSTRAINT "auth_user_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_verification" DROP CONSTRAINT "auth_verification_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

