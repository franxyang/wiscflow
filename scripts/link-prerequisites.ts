import { prisma } from "./utils/prisma-client"
import { extractCourseCodesFromPrereqText } from "./utils/validators"

async function linkPrerequisites() {
  console.log("🔗 Linking course prerequisites...")
  console.log("=" .repeat(50))

  // Get all courses with prerequisite text
  const coursesWithPrereqs = await prisma.course.findMany({
    where: {
      prerequisiteText: { not: null },
    },
    select: {
      id: true,
      code: true,
      prerequisiteText: true,
    },
  })

  console.log(`   Found ${coursesWithPrereqs.length} courses with prerequisite text`)

  let linkedCount = 0
  let skippedCount = 0
  const notFoundCodes: Set<string> = new Set()

  for (const course of coursesWithPrereqs) {
    if (!course.prerequisiteText) continue

    // Extract course codes from the prerequisite text
    const prereqCodes = extractCourseCodesFromPrereqText(course.prerequisiteText)

    if (prereqCodes.length === 0) {
      skippedCount++
      continue
    }

    // Find existing courses matching these codes
    const prereqCourses = await prisma.course.findMany({
      where: {
        code: { in: prereqCodes },
      },
      select: { id: true, code: true },
    })

    // Track codes that weren't found
    const foundCodes = new Set(prereqCourses.map((c) => c.code))
    for (const code of prereqCodes) {
      if (!foundCodes.has(code)) {
        notFoundCodes.add(code)
      }
    }

    if (prereqCourses.length > 0) {
      try {
        await prisma.course.update({
          where: { id: course.id },
          data: {
            prerequisites: {
              connect: prereqCourses.map((p) => ({ id: p.id })),
            },
          },
        })
        linkedCount++
        console.log(
          `   ✅ ${course.code}: linked ${prereqCourses.length} prerequisites`
        )
      } catch (error) {
        console.warn(`   ⚠️ Error linking ${course.code}: ${error}`)
      }
    } else {
      skippedCount++
    }
  }

  // Summary
  console.log("\n" + "=" .repeat(50))
  console.log("📊 Prerequisite Linking Complete!")
  console.log(`   Courses with prereqs linked: ${linkedCount}`)
  console.log(`   Courses skipped (no matches): ${skippedCount}`)
  console.log(`   Unique prereq codes not found: ${notFoundCodes.size}`)

  if (notFoundCodes.size > 0 && notFoundCodes.size <= 20) {
    console.log("\n   Missing prerequisite courses:")
    for (const code of [...notFoundCodes].slice(0, 20)) {
      console.log(`      - ${code}`)
    }
  }

  // Verify the links
  const coursesWithLinks = await prisma.course.count({
    where: {
      prerequisites: { some: {} },
    },
  })
  console.log(`\n   Total courses with prerequisite links: ${coursesWithLinks}`)
}

// Run the linker
linkPrerequisites()
  .then(() => {
    console.log("\n🎉 Prerequisite linking complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  })
