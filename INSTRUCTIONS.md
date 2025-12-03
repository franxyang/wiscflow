
# INSTRUCTIONS for WiscFlow Development

This document outlines the step-by-step execution plan for Claude Code to build the WiscFlow production application. Follow these phases sequentially.

## Phase 1: Foundation & Infrastructure [COMPLETE]
*   Next.js 14+ initialized.
*   Prisma & Docker Postgres configured.
*   NextAuth v5 configured with `@wisc.edu` restriction.
*   **Action**: Ensure `docker-compose up -d` is running before starting Phase 2.

## Phase 2: Data Ingestion (The Scraper)
*Objective: Populate the empty database with real catalog data.*

1.  **Create Scripts**: Create a `scripts/` directory.
2.  **Catalog Scraper**:
    *   Write `scripts/scrape-catalog.ts` using `cheerio` or `puppeteer`.
    *   Target: `guide.wisc.edu`.
    *   Logic: Iterate through all subjects, fetch course details (Code, Name, Desc, Credits, Prereqs, Last Offered).
    *   **Prerequisite Parser**: Write a regex utility to find course codes in the prereq text and create the self-referential relations in Prisma.
3.  **Grade Distribution Ingest**:
    *   Write `scripts/ingest-grades.ts`.
    *   Source: Import public JSON data from `madgrades` (if available) or CSV exports.
    *   Map this data to the `GradeDistribution` model.

## Phase 3: Core UI Migration
*Objective: Port the React Prototype components to Next.js Server Components.*

1.  **Layout**:
    *   Migrate `App.tsx` structure to `app/layout.tsx`.
    *   Implement `Sidebar` as a global component.
2.  **Course List (`app/courses/page.tsx`)**:
    *   Make this a **Server Component**.
    *   Fetch courses via `prisma.course.findMany()`.
    *   Implement the Filters (Breadth, Level) as URL Search Params.
3.  **Course Detail (`app/courses/[courseId]/page.tsx`)**:
    *   Fetch course data + relations + grade distributions.
    *   Port the `DependencyMap` visualization logic.
    *   Port the `ReviewList` (initially empty state).
    *   **Style**: Ensure the "Ribbon W" Logo and specific Tailwind config (`tailwind.config.js`) are ported exactly.

## Phase 4: Review & Interaction System
1.  **Review Submission Form (Crucial)**:
    *   Port `components/ReviewForm.tsx` to a Client Component.
    *   **MANDATORY**: Copy the `PLACEHOLDERS` constant from the prototype. The detailed guidance text (e.g., "Example: This course touches on...") is critical for UX.
    *   **Inputs**: 
        *   Implement the **4-Grid Rating System** with dynamic background colors (Green->Red).
        *   Implement the **Assessments** checkbox grid.
        *   Implement the **Resource Link** field.
    *   Create a Server Action: `submitReview(formData)` that validates and writes to the `Review` table.
2.  **Comment System**:
    *   Implement a threaded `Comment` model linked to `Review`.
    *   UI: Add an expandable "Comments" section under each review.
    *   Action: `addComment(reviewId, text)`.
3.  **Voting**:
    *   Implement "Helpful" button using optimistic UI updates.

## Phase 5: Advanced Features (The "North Star")
1.  **Transcript Upload**:
    *   Create a parser for the UW Madison unofficial transcript PDF (text extraction).
    *   Securely store parsed grades into `StudentCourseHistory`.
2.  **GPA Predictor Widget**:
    *   On the Course Detail page, check if user has `StudentCourseHistory`.
    *   If yes, run the prediction algorithm (defined in `CLAUDE.md`) and display a "Predicted Grade" badge with a confidence interval.

## Execution Rules
*   **Do not** introduce mock data files in the production `src/` folder. Use the scraper scripts to generate real data.
*   **Style**: Maintain the "WiscFlow" clean aesthetic defined in the prototype.
