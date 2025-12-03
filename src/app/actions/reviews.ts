"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Grade } from "@prisma/client"

// Zod schema for validation
const reviewSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  instructorName: z.string().min(1, "Instructor name is required"),
  term: z.string().min(1, "Term is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100).optional().or(z.literal("")),
  gradeReceived: z.nativeEnum(Grade),
  contentRating: z.nativeEnum(Grade),
  teachingRating: z.nativeEnum(Grade),
  gradingRating: z.nativeEnum(Grade),
  workloadRating: z.nativeEnum(Grade),
  contentComment: z.string().min(10, "Content comment must be at least 10 characters"),
  teachingComment: z.string().optional().or(z.literal("")),
  gradingComment: z.string().optional().or(z.literal("")),
  workloadComment: z.string().optional().or(z.literal("")),
  assessments: z.array(z.string()).default([]),
  resourceLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

export type ReviewFormState = {
  error?: string | Record<string, string[]>
  success?: boolean
}

export async function submitReview(
  prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  // 1. Authenticate user
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "You must be signed in to submit a review" }
  }

  // 2. Parse form data
  const rawData = {
    courseId: formData.get("courseId") as string,
    instructorName: formData.get("instructorName") as string,
    term: formData.get("term") as string,
    title: formData.get("title") as string,
    gradeReceived: formData.get("gradeReceived") as string,
    contentRating: formData.get("contentRating") as string,
    teachingRating: formData.get("teachingRating") as string,
    gradingRating: formData.get("gradingRating") as string,
    workloadRating: formData.get("workloadRating") as string,
    contentComment: formData.get("contentComment") as string,
    teachingComment: formData.get("teachingComment") as string,
    gradingComment: formData.get("gradingComment") as string,
    workloadComment: formData.get("workloadComment") as string,
    assessments: formData.getAll("assessments") as string[],
    resourceLink: formData.get("resourceLink") as string,
  }

  // 3. Validate
  const parsed = reviewSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  try {
    // 4. Get or create instructor
    let instructor = await prisma.instructor.findFirst({
      where: { name: data.instructorName },
    })

    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: { name: data.instructorName },
      })
    }

    // 5. Get course to verify it exists and get code for redirect
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { code: true, id: true },
    })

    if (!course) {
      return { error: "Course not found" }
    }

    // 6. Check for duplicate review (same user + course + term)
    const existing = await prisma.review.findFirst({
      where: {
        authorId: session.user.id,
        courseId: data.courseId,
        term: data.term,
      },
    })

    if (existing) {
      return { error: "You have already reviewed this course for this term" }
    }

    // 7. Connect instructor to course if not already
    await prisma.course.update({
      where: { id: course.id },
      data: {
        instructors: {
          connect: { id: instructor.id },
        },
      },
    })

    // 8. Create review
    await prisma.review.create({
      data: {
        term: data.term,
        title: data.title || null,
        gradeReceived: data.gradeReceived,
        contentRating: data.contentRating,
        teachingRating: data.teachingRating,
        gradingRating: data.gradingRating,
        workloadRating: data.workloadRating,
        contentComment: data.contentComment || null,
        teachingComment: data.teachingComment || null,
        gradingComment: data.gradingComment || null,
        workloadComment: data.workloadComment || null,
        assessments: data.assessments,
        resourceLink: data.resourceLink || null,
        authorId: session.user.id,
        courseId: data.courseId,
        instructorId: instructor.id,
      },
    })

    // 9. Revalidate and redirect
    revalidatePath(`/courses/${course.code}`)
    redirect(`/courses/${encodeURIComponent(course.code)}?review=success`)
  } catch (error) {
    // Handle redirect (Next.js throws NEXT_REDIRECT)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }
    console.error("Failed to submit review:", error)
    return { error: "Failed to submit review. Please try again." }
  }
}
