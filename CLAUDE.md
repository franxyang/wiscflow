
# CLAUDE.md - WiscFlow Architecture Specification

This file serves as the master architectural guide for the **WiscFlow** project (formerly MADSPACE). It defines the technical standards, database schema, and development protocols required to transition this project from a frontend prototype to a production-ready, full-stack Next.js application.

**ROLE:** Act as a Senior Full-Stack Architect. Prioritize type safety, data integrity, and scalable performance.

---

## 1. Project Identity & Core Stack

*   **Name:** WiscFlow
*   **Domain:** UW Madison Course Review & Academic Planning Platform.
*   **Status:** Transitioning from React SPA Prototype -> Next.js Production App.
*   **Tech Stack:**
    *   **Framework:** Next.js 14+ (App Router).
    *   **Language:** TypeScript (Strict Mode).
    *   **Styling:** Tailwind CSS (using the WiscFlow Design System defined below).
    *   **Database:** PostgreSQL.
    *   **ORM:** Prisma.
    *   **Auth:** NextAuth.js (v5) - Restrict to `@wisc.edu` emails.
    *   **Icons:** Lucide React.

---

## 2. Design System & Branding

**IMPORTANT:** You must strictly adhere to the visual identity established in the prototype.

*   **Primary Brand Color:** UW Red (`#c5050c`).
*   **Secondary Palette:** Slate (Grayscale), Indigo (Links/Action), Emerald/Amber (Grades).
*   **Font:** Inter (Google Fonts).
*   **Logo:** The "Ribbon W" (defined in `components/Logo.tsx`).
*   **UI Philosophy:** "Clean, Academic, Modern". Use ample whitespace, subtle borders (`border-slate-200`), and soft shadows (`shadow-sm`).
*   **Components:**
    *   Use **Server Components** by default.
    *   Use **Client Components** only for interactivity (forms, filters, toggles).
    *   **Do not** rely on heavy UI libraries (MUI/AntD). Build atomic components using Tailwind primitives.

---

## 3. Database Schema (Prisma)

The database is the source of truth. **ALL mock data (MOCK_COURSES, MOCK_REVIEWS) currently in `constants.ts` must be discarded.** The database will be populated via scraping and user input.

### Core Models

```prisma
// User: Must be authenticated via wisc.edu email
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          UserRole  @default(STUDENT) // STUDENT, ADMIN
  
  // Community
  reviews       Review[]
  comments      Comment[] // Replies to reviews
  votes         Vote[]
  
  // Personalization
  savedCourses  SavedCourse[]
  transcript    StudentCourseHistory[] // For GPA Prediction Feature
  
  createdAt     DateTime  @default(now())
}

// School: e.g., "College of Engineering"
model School {
  id        String   @id @default(cuid())
  name      String   @unique
  courses   Course[]
}

// Course: The static catalog data
model Course {
  id            String   @id @default(cuid())
  code          String   @unique // e.g. "CS 577"
  name          String
  description   String   @db.Text
  credits       Int
  
  // Relations
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])
  
  // Prereq Logic for Visualization
  prerequisiteText String? // Raw text from guide.wisc.edu
  prerequisites    Course[] @relation("CoursePrereqs")
  prerequisiteFor  Course[] @relation("CoursePrereqs")
  
  // Attributes for Filtering
  breadths      String[] // Array of strings: "Physical Science", etc.
  genEds        String[] // Array of strings: "Comm A", etc.
  level         String   // "Elementary", "Intermediate", "Advanced"
  
  reviews       Review[]
  instructors   Instructor[]
  
  // Statistics (updated via cron/trigger)
  avgGPA        Float?   // Aggregate from GradeDistributions
  avgRating     Float?   // Aggregate from Reviews
  
  // Historical Data
  gradeDistributions GradeDistribution[]
  
  // Metadata
  lastOffered   String?
  updatedAt     DateTime @updatedAt
}

// Grade Distribution: Official historical data scraped from Madgrades/Registrar
model GradeDistribution {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  term      String   // e.g. "2023-Fall"
  
  // Counts
  aCount    Int      @default(0)
  abCount   Int      @default(0)
  bCount    Int      @default(0)
  bcCount   Int      @default(0)
  cCount    Int      @default(0)
  dCount    Int      @default(0)
  fCount    Int      @default(0)
  
  totalGraded Int
  avgGPA      Float
}

// Review: User generated content (NO SEED DATA ALLOWED)
model Review {
  id            String   @id @default(cuid())
  
  // Core Metadata
  term          String   // e.g., "Fall 2024"
  title         String?  // Short review title
  gradeReceived Grade    // Enum: A, AB, B, BC...
  
  // MANDATORY Grading Dimensions (Strict Grade Enum to prevent bad data)
  contentRating  Grade
  teachingRating Grade
  gradingRating  Grade
  workloadRating Grade
  
  // Specific Text Comments per Dimension
  contentComment  String? @db.Text
  teachingComment String? @db.Text
  gradingComment  String? @db.Text
  workloadComment String? @db.Text
  
  // Metadata
  assessments   String[] // Array: ["Midterm", "Final", "Essay"]
  tags          String[] 
  
  // Resources (Optional)
  resourceLink  String?  // Optional URL to Google Drive/Box for course materials
  
  // Relations
  instructorId  String
  instructor    Instructor @relation(fields: [instructorId], references: [id])
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id])
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
  
  likes         Vote[]
  comments      Comment[] // Threaded discussion
  createdAt     DateTime @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  text      String   @db.Text
  
  // Relations
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  reviewId  String
  review    Review   @relation(fields: [reviewId], references: [id])
  
  createdAt DateTime @default(now())
}

model Instructor {
  id        String   @id @default(cuid())
  name      String   @unique
  courses   Course[]
  reviews   Review[]
}

// Transcript: Encrypted/Private user history for GPA Prediction
model StudentCourseHistory {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  courseCode  String   // Store code string to survive catalog changes
  term        String
  grade       Grade
  credits     Int
}

// Enums
enum UserRole {
  STUDENT
  ADMIN
}

enum Grade {
  A
  AB
  B
  BC
  C
  D
  F
}
