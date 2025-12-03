/*
  Warnings:

  - Changed the type of `contentRating` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `teachingRating` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gradingRating` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `workloadRating` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "contentRating",
ADD COLUMN     "contentRating" "Grade" NOT NULL,
DROP COLUMN "teachingRating",
ADD COLUMN     "teachingRating" "Grade" NOT NULL,
DROP COLUMN "gradingRating",
ADD COLUMN     "gradingRating" "Grade" NOT NULL,
DROP COLUMN "workloadRating",
ADD COLUMN     "workloadRating" "Grade" NOT NULL;
