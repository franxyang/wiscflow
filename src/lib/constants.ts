// Grade type enum (matches Prisma Grade enum)
export enum GradeType {
  A = "A",
  AB = "AB",
  B = "B",
  BC = "BC",
  C = "C",
  D = "D",
  F = "F",
}

// Grade color mappings for UI
export const GRADE_COLORS: Record<GradeType, string> = {
  [GradeType.A]: "bg-green-500 text-white",
  [GradeType.AB]: "bg-green-400 text-white",
  [GradeType.B]: "bg-blue-500 text-white",
  [GradeType.BC]: "bg-blue-400 text-white",
  [GradeType.C]: "bg-yellow-400 text-white",
  [GradeType.D]: "bg-orange-400 text-white",
  [GradeType.F]: "bg-red-500 text-white",
}

export const GRADE_BG_COLORS: Record<GradeType, string> = {
  [GradeType.A]: "bg-green-100 text-green-700 border-green-200",
  [GradeType.AB]: "bg-green-50 text-green-600 border-green-200",
  [GradeType.B]: "bg-blue-100 text-blue-700 border-blue-200",
  [GradeType.BC]: "bg-blue-50 text-blue-600 border-blue-200",
  [GradeType.C]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [GradeType.D]: "bg-orange-100 text-orange-700 border-orange-200",
  [GradeType.F]: "bg-red-100 text-red-700 border-red-200",
}

// Filter options for course list
export const FILTER_OPTIONS = {
  breadth: [
    "Biological Sciences",
    "Humanities",
    "Literature",
    "Natural Sciences",
    "Physical Sciences",
    "Social Sciences",
  ],
  genEd: [
    "Communication A",
    "Communication B",
    "Quantitative Reasoning A",
    "Quantitative Reasoning B",
    "Ethnic Studies",
  ],
  level: ["Elementary", "Intermediate", "Advanced"],
}

// UW Schools
export const UW_SCHOOLS = [
  "Agricultural & Life Sciences, College of",
  "Arts, Division of the",
  "Business, School of",
  "Computer Data & Information Sciences, School of",
  "Continuing Studies, Division of",
  "Education, School of",
  "Engineering, College of",
  "Environmental Studies, Nelson Institute for",
  "Graduate School",
  "Human Ecology, School of",
  "Information School",
  "International Division",
  "Journalism and Mass Communication, School of",
  "Language Institute",
  "Law School",
  "Letters & Science, College of",
  "Medicine and Public Health, School of",
  "Music, School of",
  "Nursing, School of",
  "Pharmacy, School of",
  "Public Affairs, School of",
  "Social Work, School of",
  "Veterinary Medicine, School of",
]

// Quick links for dashboard
export const QUICK_LINKS = [
  { name: "Canvas", url: "https://canvas.wisc.edu", category: "Essentials" },
  { name: "Student Center", url: "https://my.wisc.edu", category: "Essentials" },
  { name: "Course Guide", url: "https://guide.wisc.edu", category: "Essentials" },
  { name: "Degree Planner", url: "#", category: "Curriculum" },
  { name: "Career Services", url: "#", category: "Departments" },
]

// Mock data for demo courses (used when DB has no stats/reviews)
export const MOCK_STATS = {
  reviewCount: 42,
  avgGrade: GradeType.B,
  contentScore: GradeType.AB,
  teachingScore: GradeType.B,
  gradingScore: GradeType.BC,
  workloadScore: GradeType.C,
}

export const MOCK_INSTRUCTORS = [
  "Staff",
]

export const MOCK_REVIEWS = [
  {
    id: "demo-1",
    author: "WiscStudent",
    term: "Fall 2024",
    title: "Great course overall",
    instructor: "Staff",
    date: "Nov 15, 2024",
    gradeReceived: GradeType.AB,
    ratings: {
      content: GradeType.A,
      teaching: GradeType.AB,
      grading: GradeType.B,
      workload: GradeType.C,
    },
    dimensionComments: {
      content: "The material is well-organized and covers important topics.",
      teaching: "Lectures are clear and engaging.",
      grading: "Fair grading with clear rubrics.",
      workload: "Expect to spend significant time on assignments.",
    },
    assessments: ["Mid-term Exam", "Final Exam", "Assignment"],
    tags: ["Well Organized"],
    text: "Overall a solid course that covers the fundamentals well.",
    likes: 12,
    comments: [] as Array<{ id: string; author: string; date: string; text: string }>,
  },
]
