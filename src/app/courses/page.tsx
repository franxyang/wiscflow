import { prisma } from "@/lib/prisma"
import { CourseList } from "@/components/CourseList"

interface PageProps {
  searchParams: Promise<{ search?: string; school?: string }>
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ""
  const school = params.school || ""

  // Build where clause for initial server-side filtering
  const whereClause: {
    OR?: Array<{ code: { contains: string; mode: "insensitive" } } | { name: { contains: string; mode: "insensitive" } }>
    school?: { name: string }
  } = {}

  if (search) {
    whereClause.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ]
  }

  if (school) {
    whereClause.school = { name: school }
  }

  // Fetch courses from database
  const courses = await prisma.course.findMany({
    where: whereClause,
    include: {
      school: true,
    },
    orderBy: {
      code: "asc",
    },
    take: 500, // Limit for performance
  })

  const courseData = courses.map((course) => ({
    code: course.code,
    name: course.name,
    description: course.description || "",
    credits: course.credits,
    schoolName: course.school?.name || "Unknown",
    level: course.level || "",
    breadths: course.breadths || [],
    genEds: course.genEds || [],
  }))

  return (
    <CourseList
      courses={courseData}
      initialSearch={search}
      initialSchool={school}
    />
  )
}
