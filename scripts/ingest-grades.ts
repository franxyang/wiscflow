import PQueue from "p-queue"
import { prisma } from "./utils/prisma-client"
import { calculateGPA, normalizeCourseCode } from "./utils/validators"

// Madgrades API configuration
const MADGRADES_API_URL = "https://api.madgrades.com/v1"
const API_TOKEN = process.env.MADGRADES_API_TOKEN

if (!API_TOKEN) {
  console.error("❌ MADGRADES_API_TOKEN environment variable is not set")
  console.error("   Add it to your .env file: MADGRADES_API_TOKEN=your_token_here")
  process.exit(1)
}

// Rate limiting: 5 requests per second to be respectful
const queue = new PQueue({ concurrency: 5, interval: 1000, intervalCap: 5 })

// Statistics
const stats = {
  coursesProcessed: 0,
  gradesInserted: 0,
  coursesNotFound: 0,
  apiErrors: 0,
}

interface MadgradesGradeData {
  termCode: string
  termName: string
  aCount: number
  abCount: number
  bCount: number
  bcCount: number
  cCount: number
  dCount: number
  fCount: number
  sCount?: number
  uCount?: number
  crCount?: number
  nCount?: number
  pCount?: number
  iCount?: number
  nwCount?: number
  otherCount?: number
  total: number
}

interface MadgradesCourseResponse {
  uuid: string
  subjectCode: string
  courseNumber: number
  name: string
  grades: MadgradesGradeData[]
}

// Fetch grades for a course from Madgrades API
async function fetchCourseGrades(
  subjectCode: string,
  courseNumber: string
): Promise<MadgradesGradeData[] | null> {
  const url = `${MADGRADES_API_URL}/courses/${subjectCode}/${courseNumber}/grades`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${API_TOKEN}`,
        Accept: "application/json",
      },
    })

    if (response.status === 404) {
      return null // Course not found in Madgrades
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: MadgradesCourseResponse = await response.json()
    return data.grades || []
  } catch (error) {
    stats.apiErrors++
    console.warn(`  ⚠️ API error for ${subjectCode} ${courseNumber}: ${error}`)
    return null
  }
}

// Convert Madgrades term format to our format
function normalizeTermName(termName: string): string {
  // Madgrades uses: "Fall 2023", "Spring 2024", "Summer 2023"
  // We want: "Fall 2023" (keep as-is)
  return termName.trim()
}

// Process a single course
async function processCourse(course: { id: string; code: string }): Promise<void> {
  // Parse course code: "COMP SCI 577" -> subject="COMP SCI", number="577"
  const match = course.code.match(/^(.+?)\s+(\d{3})$/)
  if (!match) {
    console.warn(`  ⚠️ Could not parse course code: ${course.code}`)
    return
  }

  const subjectName = match[1]
  const courseNumber = match[2]

  // Convert subject name to Madgrades format (e.g., "COMP SCI" -> "COMP_SCI")
  const subjectCode = subjectName.replace(/\s+/g, "_").toLowerCase()

  const grades = await fetchCourseGrades(subjectCode, courseNumber)

  if (!grades || grades.length === 0) {
    stats.coursesNotFound++
    return
  }

  // Insert grade distributions for each term
  for (const gradeData of grades) {
    try {
      const term = normalizeTermName(gradeData.termName)
      const totalGraded =
        gradeData.aCount +
        gradeData.abCount +
        gradeData.bCount +
        gradeData.bcCount +
        gradeData.cCount +
        gradeData.dCount +
        gradeData.fCount

      if (totalGraded === 0) continue

      const avgGPA = calculateGPA({
        aCount: gradeData.aCount,
        abCount: gradeData.abCount,
        bCount: gradeData.bCount,
        bcCount: gradeData.bcCount,
        cCount: gradeData.cCount,
        dCount: gradeData.dCount,
        fCount: gradeData.fCount,
      })

      await prisma.gradeDistribution.upsert({
        where: {
          courseId_term: {
            courseId: course.id,
            term,
          },
        },
        update: {
          aCount: gradeData.aCount,
          abCount: gradeData.abCount,
          bCount: gradeData.bCount,
          bcCount: gradeData.bcCount,
          cCount: gradeData.cCount,
          dCount: gradeData.dCount,
          fCount: gradeData.fCount,
          totalGraded,
          avgGPA,
        },
        create: {
          courseId: course.id,
          term,
          aCount: gradeData.aCount,
          abCount: gradeData.abCount,
          bCount: gradeData.bCount,
          bcCount: gradeData.bcCount,
          cCount: gradeData.cCount,
          dCount: gradeData.dCount,
          fCount: gradeData.fCount,
          totalGraded,
          avgGPA,
        },
      })

      stats.gradesInserted++
    } catch (error) {
      console.warn(`  ⚠️ Error inserting grades for ${course.code} ${gradeData.termName}: ${error}`)
    }
  }

  stats.coursesProcessed++
}

// Update course avgGPA from grade distributions
async function updateCourseAverages(): Promise<void> {
  console.log("\n📊 Updating course average GPAs...")

  const courses = await prisma.course.findMany({
    where: {
      gradeDistributions: { some: {} },
    },
    select: {
      id: true,
      code: true,
      gradeDistributions: {
        select: {
          avgGPA: true,
          totalGraded: true,
        },
      },
    },
  })

  for (const course of courses) {
    if (course.gradeDistributions.length === 0) continue

    // Calculate weighted average GPA across all terms
    let totalStudents = 0
    let weightedSum = 0

    for (const dist of course.gradeDistributions) {
      totalStudents += dist.totalGraded
      weightedSum += dist.avgGPA * dist.totalGraded
    }

    const avgGPA = totalStudents > 0 ? weightedSum / totalStudents : null

    await prisma.course.update({
      where: { id: course.id },
      data: { avgGPA: avgGPA ? Math.round(avgGPA * 100) / 100 : null },
    })
  }

  console.log(`   Updated ${courses.length} courses with average GPAs`)
}

// Main function
async function ingestGrades() {
  console.log("📈 Starting Madgrades Data Ingestion")
  console.log("=" .repeat(50))

  const startTime = Date.now()

  // Get all courses from database
  const courses = await prisma.course.findMany({
    select: { id: true, code: true },
  })

  console.log(`   Found ${courses.length} courses to process`)

  // Process courses with rate limiting
  let processed = 0
  for (const course of courses) {
    await queue.add(async () => {
      await processCourse(course)
      processed++

      // Progress update every 100 courses
      if (processed % 100 === 0) {
        console.log(`   Progress: ${processed}/${courses.length} courses`)
      }
    })
  }

  // Wait for all tasks to complete
  await queue.onIdle()

  // Update course averages
  await updateCourseAverages()

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("\n" + "=" .repeat(50))
  console.log("📊 Grade Ingestion Complete!")
  console.log(`   Courses processed: ${stats.coursesProcessed}`)
  console.log(`   Grade distributions inserted: ${stats.gradesInserted}`)
  console.log(`   Courses not in Madgrades: ${stats.coursesNotFound}`)
  console.log(`   API errors: ${stats.apiErrors}`)
  console.log(`   Duration: ${duration}s`)

  // Final stats from database
  const totalDistributions = await prisma.gradeDistribution.count()
  const coursesWithGrades = await prisma.course.count({
    where: { gradeDistributions: { some: {} } },
  })

  console.log(`\n   Database totals:`)
  console.log(`   - Grade distributions: ${totalDistributions}`)
  console.log(`   - Courses with grades: ${coursesWithGrades}`)
}

// Run the ingestion
ingestGrades()
  .then(() => {
    console.log("\n🎉 Grade ingestion complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  })
