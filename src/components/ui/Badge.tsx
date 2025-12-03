import { GradeType, GRADE_COLORS, GRADE_BG_COLORS } from "@/lib/constants"

interface BadgeProps {
  grade?: GradeType | string
  text?: string
  variant?: "solid" | "outline" | "subtle"
  className?: string
}

export function Badge({
  grade,
  text,
  variant = "solid",
  className = "",
}: BadgeProps) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200"

  if (grade) {
    const gradeKey = grade as GradeType
    if (variant === "solid" && GRADE_COLORS[gradeKey]) {
      colorClass = GRADE_COLORS[gradeKey]
    }
    if (variant === "subtle" && GRADE_BG_COLORS[gradeKey]) {
      colorClass = GRADE_BG_COLORS[gradeKey]
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-sm font-medium border ${
        grade && variant === "solid" ? "border-transparent" : ""
      } ${colorClass} ${className}`}
    >
      {text || grade}
    </span>
  )
}
