import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { ReviewForm } from "@/components/ReviewForm"
import Link from "next/link"
import { ArrowLeft, LogIn } from "lucide-react"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code)

  // Check authentication
  const session = await auth()

  // Fetch course with instructors
  const course = await prisma.course.findUnique({
    where: { code: decodedCode },
    include: {
      school: true,
      instructors: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // If not authenticated, show login prompt
  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={24} className="text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in Required</h1>
          <p className="text-slate-500 mb-6">
            You need to sign in with your @wisc.edu email to write a review.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(`/courses/${code}/review`)}`}
              className="px-6 py-3 bg-[#c5050c] text-white font-medium rounded-lg hover:bg-[#9b0000] transition-colors"
            >
              Sign In with Google
            </Link>
            <Link
              href={`/courses/${code}`}
              className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Transform course data for the form
  const courseData = {
    id: course.id,
    code: course.code,
    name: course.name,
    schoolName: course.school?.name || "Unknown",
    instructors: course.instructors,
  }

  // Generate term options (last few semesters)
  const currentYear = new Date().getFullYear()
  const termOptions = [
    `Fall ${currentYear}`,
    `Summer ${currentYear}`,
    `Spring ${currentYear}`,
    `Fall ${currentYear - 1}`,
    `Summer ${currentYear - 1}`,
    `Spring ${currentYear - 1}`,
    `Fall ${currentYear - 2}`,
  ]

  return <ReviewForm course={courseData} termOptions={termOptions} />
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code)

  const course = await prisma.course.findUnique({
    where: { code: decodedCode },
    select: { code: true, name: true },
  })

  if (!course) {
    return { title: "Course Not Found - WiscFlow" }
  }

  return {
    title: `Write Review for ${course.code} | WiscFlow`,
    description: `Share your experience in ${course.code} - ${course.name} at UW Madison`,
  }
}
