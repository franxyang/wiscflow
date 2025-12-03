import * as cheerio from "cheerio"
import PQueue from "p-queue"
import * as fs from "fs"
import { prisma } from "./utils/prisma-client"
import {
  normalizeCourseCode,
  type ParsedCourse,
} from "./utils/validators"

const BASE_URL = "https://guide.wisc.edu"
const COURSES_URL = `${BASE_URL}/courses/`

// Rate limiting: 3 concurrent requests, 500ms between batches
const queue = new PQueue({ concurrency: 3, interval: 500, intervalCap: 3 })

// Statistics
const stats = {
  subjectsScraped: 0,
  coursesFound: 0,
  coursesInserted: 0,
  errors: [] as { subject: string; error: string }[],
}

// Retry with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "WiscFlow Course Scraper (Educational Project)",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.text()
    } catch (error) {
      const delay = Math.pow(2, attempt) * 1000
      console.warn(
        `  ⚠️ Retry ${attempt + 1}/${maxRetries} for ${url} after ${delay}ms`
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
}

// Get all subject URLs from the courses index page
async function getSubjectUrls(): Promise<string[]> {
  console.log("📚 Fetching subject list from guide.wisc.edu...")
  const html = await fetchWithRetry(COURSES_URL)
  const $ = cheerio.load(html)

  const subjects: string[] = []

  // Find all links to /courses/{subject}/
  $('a[href^="/courses/"]').each((_, el) => {
    const href = $(el).attr("href")
    if (href && href !== "/courses/" && href.endsWith("/")) {
      subjects.push(href)
    }
  })

  // Remove duplicates
  const uniqueSubjects = [...new Set(subjects)]
  console.log(`   Found ${uniqueSubjects.length} subjects`)
  return uniqueSubjects
}

// Parse a single course block from HTML
function parseCourseBlock(
  $: cheerio.Root,
  courseBlock: cheerio.Element,
  defaultSchool: string
): ParsedCourse | null {
  try {
    const block = $(courseBlock)

    // Get the course header (contains code and name)
    const headerText = block.find(".courseblocktitle").text().trim()
    if (!headerText) return null

    // Parse: "COMP SCI 200 — PROGRAMMING I" or "COMP SCI/ECE 252 — INTRO TO COMPUTER ENGINEERING"
    const headerMatch = headerText.match(
      /^([A-Z][A-Z\s\/]+)\s*(\d{3})\s*[—–-]\s*(.+)$/
    )
    if (!headerMatch) {
      console.warn(`  ⚠️ Could not parse header: ${headerText.substring(0, 50)}`)
      return null
    }

    // Take the first subject if cross-listed
    const subjectPart = headerMatch[1].split("/")[0].trim()
    const courseNumber = headerMatch[2]
    const courseName = headerMatch[3].trim()
    const code = normalizeCourseCode(`${subjectPart} ${courseNumber}`)

    // Credits
    const creditsText = block.find(".courseblockcredits").text()
    const creditsMatch = creditsText.match(/(\d+)/)
    const credits = creditsMatch ? parseInt(creditsMatch[1]) : 3

    // Description
    const description =
      block.find(".courseblockdesc").text().trim() || "No description available."

    // Extra info block contains prereqs, designations, etc.
    const extraBlock = block.find(".courseblockextra")
    const extraText = extraBlock.text()

    // Prerequisites
    let prerequisiteText: string | null = null
    const prereqMatch = extraText.match(/Requisites?:\s*([^\.]+\.)/i)
    if (prereqMatch) {
      prerequisiteText = prereqMatch[1].trim()
    }

    // Course Designation parsing
    const breadths: string[] = []
    const genEds: string[] = []
    let level = "Intermediate" // Default

    // Breadth
    const breadthPatterns = [
      /Biological Science/i,
      /Humanities/i,
      /Literature/i,
      /Natural Science/i,
      /Physical Science/i,
      /Social Science/i,
    ]
    for (const pattern of breadthPatterns) {
      if (pattern.test(extraText)) {
        breadths.push(pattern.source.replace(/\\i$/, "").replace(/\\/g, ""))
      }
    }

    // Gen Ed
    if (/Communication.*?A/i.test(extraText)) genEds.push("Communication A")
    if (/Communication.*?B/i.test(extraText)) genEds.push("Communication B")
    if (/Quantitative.*?A/i.test(extraText)) genEds.push("Quantitative Reasoning A")
    if (/Quantitative.*?B/i.test(extraText)) genEds.push("Quantitative Reasoning B")
    if (/Ethnic Studies/i.test(extraText)) genEds.push("Ethnic Studies")

    // Level
    if (/Level.*?Elementary/i.test(extraText)) level = "Elementary"
    else if (/Level.*?Advanced/i.test(extraText)) level = "Advanced"
    else if (/Level.*?Intermediate/i.test(extraText)) level = "Intermediate"

    // Last Offered
    let lastOffered: string | null = null
    const lastTaughtMatch = extraText.match(/Last Taught:\s*([^\.]+)/i)
    if (lastTaughtMatch) {
      lastOffered = lastTaughtMatch[1].trim()
    }

    return {
      code,
      name: courseName,
      description,
      credits,
      schoolName: defaultSchool,
      prerequisiteText,
      breadths,
      genEds,
      level: level as "Elementary" | "Intermediate" | "Advanced",
      lastOffered,
    }
  } catch (error) {
    console.warn(`  ⚠️ Error parsing course block: ${error}`)
    return null
  }
}

// Scrape all courses from a subject page
async function scrapeSubjectPage(
  subjectPath: string
): Promise<ParsedCourse[]> {
  const url = `${BASE_URL}${subjectPath}`
  const html = await fetchWithRetry(url)
  const $ = cheerio.load(html)

  const courses: ParsedCourse[] = []

  // Determine the school based on subject (simplified mapping)
  // In practice, you'd want a more complete mapping
  const subjectCode = subjectPath.replace("/courses/", "").replace("/", "")
  const schoolName = determineSchool(subjectCode)

  // Each course is in a div with class "courseblock"
  $(".courseblock").each((_, courseBlock) => {
    const course = parseCourseBlock($, courseBlock, schoolName)
    if (course) {
      courses.push(course)
    }
  })

  return courses
}

// Map subject codes to schools (simplified)
function determineSchool(subjectCode: string): string {
  const subjectToSchool: Record<string, string> = {
    comp_sci: "Computer Data & Information Sciences, School of",
    math: "Letters & Science, College of",
    stat: "Letters & Science, College of",
    physics: "Letters & Science, College of",
    chem: "Letters & Science, College of",
    biology: "Letters & Science, College of",
    psych: "Letters & Science, College of",
    econ: "Letters & Science, College of",
    english: "Letters & Science, College of",
    history: "Letters & Science, College of",
    e_c_e: "Engineering, College of",
    m_e: "Engineering, College of",
    c_b_e: "Engineering, College of",
    i_sy_e: "Engineering, College of",
    b_m_e: "Engineering, College of",
    civil: "Engineering, College of",
    bus: "Business, School of",
    acct_i_s: "Business, School of",
    finance: "Business, School of",
    marketing: "Business, School of",
    nursing: "Nursing, School of",
    pharmacy: "Pharmacy, School of",
    law: "Law School",
    music: "Music, School of",
    education: "Education, School of",
    medicine: "Medicine and Public Health, School of",
    // Default for unknown subjects
  }

  return subjectToSchool[subjectCode] || "Letters & Science, College of"
}

// Insert courses into database
async function insertCourses(courses: ParsedCourse[]): Promise<number> {
  let inserted = 0

  for (const course of courses) {
    try {
      // Get or create school
      const school = await prisma.school.upsert({
        where: { name: course.schoolName },
        update: {},
        create: { name: course.schoolName },
      })

      // Upsert course
      await prisma.course.upsert({
        where: { code: course.code },
        update: {
          name: course.name,
          description: course.description,
          credits: course.credits,
          schoolId: school.id,
          prerequisiteText: course.prerequisiteText,
          breadths: course.breadths,
          genEds: course.genEds,
          level: course.level,
          lastOffered: course.lastOffered,
        },
        create: {
          code: course.code,
          name: course.name,
          description: course.description,
          credits: course.credits,
          schoolId: school.id,
          prerequisiteText: course.prerequisiteText,
          breadths: course.breadths,
          genEds: course.genEds,
          level: course.level,
          lastOffered: course.lastOffered,
        },
      })

      inserted++
    } catch (error) {
      console.warn(`  ⚠️ Error inserting ${course.code}: ${error}`)
    }
  }

  return inserted
}

// Main scraper function
async function scrapeCatalog() {
  console.log("🚀 Starting UW Madison Course Catalog Scraper")
  console.log("=" .repeat(50))

  const startTime = Date.now()

  // Get all subject URLs
  const subjectUrls = await getSubjectUrls()

  // Process subjects with rate limiting
  for (const subjectPath of subjectUrls) {
    const subjectCode = subjectPath.replace("/courses/", "").replace("/", "")

    await queue.add(async () => {
      try {
        console.log(`📖 Scraping: ${subjectCode}`)
        const courses = await scrapeSubjectPage(subjectPath)
        stats.coursesFound += courses.length

        if (courses.length > 0) {
          const inserted = await insertCourses(courses)
          stats.coursesInserted += inserted
          console.log(`   ✅ Found ${courses.length} courses, inserted ${inserted}`)
        } else {
          console.log(`   ⚠️ No courses found`)
        }

        stats.subjectsScraped++
      } catch (error) {
        stats.errors.push({
          subject: subjectCode,
          error: String(error),
        })
        console.error(`   ❌ Error: ${error}`)
      }
    })
  }

  // Wait for all tasks to complete
  await queue.onIdle()

  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("\n" + "=" .repeat(50))
  console.log("📊 Scraping Complete!")
  console.log(`   Subjects scraped: ${stats.subjectsScraped}`)
  console.log(`   Courses found: ${stats.coursesFound}`)
  console.log(`   Courses inserted: ${stats.coursesInserted}`)
  console.log(`   Errors: ${stats.errors.length}`)
  console.log(`   Duration: ${duration}s`)

  // Save errors to file for review
  if (stats.errors.length > 0) {
    fs.writeFileSync(
      "scripts/data/scrape-errors.json",
      JSON.stringify(stats.errors, null, 2)
    )
    console.log("   Errors saved to: scripts/data/scrape-errors.json")
  }
}

// Run the scraper
scrapeCatalog()
  .then(() => {
    console.log("\n🎉 Catalog scraping complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  })
