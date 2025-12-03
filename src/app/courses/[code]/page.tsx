import { prisma } from "@/lib/prisma"
import { CourseDetail } from "@/components/CourseDetail"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code)

  // Fetch course with relations
  const course = await prisma.course.findUnique({
    where: { code: decodedCode },
    include: {
      school: true,
      instructors: true,
      prerequisites: {
        select: { code: true },
      },
      prerequisiteFor: {
        select: { code: true },
        take: 10,
      },
      reviews: {
        take: 1,
      },
      gradeDistributions: {
        take: 1,
      },
    },
  })

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Course Not Found</h1>
        <p className="text-slate-500 mb-6">
          The course &quot;{decodedCode}&quot; was not found in the catalog.
        </p>
        <Link
          href="/courses"
          className="flex items-center gap-2 px-4 py-2 bg-[#c5050c] text-white rounded-lg hover:bg-[#9b0000] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Catalog
        </Link>
      </div>
    )
  }

  // Transform data for component
  const courseData = {
    code: course.code,
    name: course.name,
    description: course.description || "",
    credits: course.credits,
    schoolName: course.school?.name || "Unknown",
    level: course.level || "",
    breadths: course.breadths || [],
    genEds: course.genEds || [],
    prerequisiteText: course.prerequisiteText,
    prerequisiteCodes: course.prerequisites.map((p) => p.code),
    leadsTo: course.prerequisiteFor.map((p) => p.code),
    instructors: course.instructors.map((i) => i.name),
    hasReviews: course.reviews.length > 0,
    hasGrades: course.gradeDistributions.length > 0,
  }

  return <CourseDetail course={courseData} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code)

  const course = await prisma.course.findUnique({
    where: { code: decodedCode },
    select: { code: true, name: true },
  })

  if (!course) {
    return {
      title: "Course Not Found - WiscFlow",
    }
  }

  return {
    title: `${course.code} - ${course.name} | WiscFlow`,
    description: `Reviews and grade distributions for ${course.code} at UW Madison`,
  }
}
