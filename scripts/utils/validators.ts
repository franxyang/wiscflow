import { z } from "zod"

// Course code pattern: "COMP SCI 577", "MATH 222", "ECON 101"
const courseCodePattern = /^[A-Z][A-Z\s]*\d{3}$/

export const CourseSchema = z.object({
  code: z.string().regex(courseCodePattern, "Invalid course code format"),
  name: z.string().min(3).max(300),
  description: z.string().min(10),
  credits: z.number().int().min(0).max(12),
  schoolName: z.string().min(1),
  prerequisiteText: z.string().nullable(),
  breadths: z.array(z.string()),
  genEds: z.array(z.string()),
  level: z.enum(["Elementary", "Intermediate", "Advanced"]),
  lastOffered: z.string().nullable(),
  instructors: z.array(z.string()).optional(),
})

export type ParsedCourse = z.infer<typeof CourseSchema>

export const GradeDistributionSchema = z.object({
  courseCode: z.string(),
  term: z.string(), // e.g., "Fall 2023" or "2023-Fall"
  aCount: z.number().int().min(0),
  abCount: z.number().int().min(0),
  bCount: z.number().int().min(0),
  bcCount: z.number().int().min(0),
  cCount: z.number().int().min(0),
  dCount: z.number().int().min(0),
  fCount: z.number().int().min(0),
})

export type ParsedGradeDistribution = z.infer<typeof GradeDistributionSchema>

// Normalize course code: "comp sci  577" -> "COMP SCI 577"
export function normalizeCourseCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
}

// Calculate GPA from grade counts (UW Madison scale)
export function calculateGPA(grades: {
  aCount: number
  abCount: number
  bCount: number
  bcCount: number
  cCount: number
  dCount: number
  fCount: number
}): number {
  const total =
    grades.aCount +
    grades.abCount +
    grades.bCount +
    grades.bcCount +
    grades.cCount +
    grades.dCount +
    grades.fCount

  if (total === 0) return 0

  const points =
    grades.aCount * 4.0 +
    grades.abCount * 3.5 +
    grades.bCount * 3.0 +
    grades.bcCount * 2.5 +
    grades.cCount * 2.0 +
    grades.dCount * 1.0 +
    grades.fCount * 0.0

  return Math.round((points / total) * 100) / 100
}

// Extract course codes from prerequisite text
export function extractCourseCodesFromPrereqText(text: string): string[] {
  // Pattern matches: "COMP SCI 400", "MATH 222", "E C E 252"
  const pattern = /([A-Z][A-Z\s]{1,12})(\d{3})/g
  const matches = [...text.matchAll(pattern)]

  const codes = matches.map((m) => {
    const subject = m[1].trim().replace(/\s+/g, " ")
    const number = m[2]
    return `${subject} ${number}`
  })

  // Return unique codes
  return [...new Set(codes)]
}
