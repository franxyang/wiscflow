import { prisma } from "@/lib/prisma"
import { Dashboard } from "@/components/Dashboard"

export default async function Home() {
  // Fetch some featured courses from the database
  const courses = await prisma.course.findMany({
    take: 4,
    include: {
      school: true,
    },
    orderBy: {
      code: "asc",
    },
    where: {
      // Get courses with common popular codes
      OR: [
        { code: { startsWith: "COMP SCI" } },
        { code: { startsWith: "MATH" } },
        { code: { startsWith: "PSYCH" } },
        { code: { startsWith: "ECON" } },
      ],
    },
  })

  const trendingCourses = courses.map((course) => ({
    code: course.code,
    name: course.name,
    schoolName: course.school?.name || "Unknown",
    description: course.description || "",
    credits: course.credits,
  }))

  return <Dashboard trendingCourses={trendingCourses} />
}
