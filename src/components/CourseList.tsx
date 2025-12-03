"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "./ui/Badge"
import { UW_SCHOOLS, FILTER_OPTIONS, GradeType } from "@/lib/constants"
import {
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Move,
  GraduationCap,
  Layers,
  Book,
} from "lucide-react"

interface CourseData {
  code: string
  name: string
  description: string
  credits: number
  schoolName: string
  level: string
  breadths: string[]
  genEds: string[]
}

interface CourseListProps {
  courses: CourseData[]
  initialSearch?: string
  initialSchool?: string
}

function FilterSection({
  title,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  title: string
  icon: React.ElementType
  options: string[]
  selected: string[]
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-bold text-slate-800 hover:text-[#c5050c] transition-colors mb-3"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-400" />
          {title}
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-slate-400" />
        ) : (
          <ChevronDown size={14} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 pl-6 animate-fade-in">
          {options.map((opt) => {
            const isChecked = selected.includes(opt)
            return (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isChecked
                      ? "bg-[#c5050c] border-[#c5050c]"
                      : "bg-white border-slate-300 group-hover:border-slate-400"
                  }`}
                >
                  {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isChecked}
                  onChange={() => onChange(opt)}
                />
                <span
                  className={`text-sm ${
                    isChecked
                      ? "text-slate-800 font-medium"
                      : "text-slate-600 group-hover:text-slate-900"
                  }`}
                >
                  {opt}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CourseList({ courses, initialSearch = "", initialSchool = "" }: CourseListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedSchool, setSelectedSchool] = useState<string>(initialSchool || "All Schools")
  const [selectedBreadth, setSelectedBreadth] = useState<string[]>([])
  const [selectedGenEd, setSelectedGenEd] = useState<string[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string[]>([])

  const toggleFilter = (list: string[], setList: (l: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter((i) => i !== value))
    } else {
      setList([...list, value])
    }
  }

  // Client-side filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !searchTerm ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSchool =
        selectedSchool === "All Schools" || course.schoolName === selectedSchool

      const matchesBreadth =
        selectedBreadth.length === 0 ||
        course.breadths?.some((b) => selectedBreadth.includes(b))

      const matchesGenEd =
        selectedGenEd.length === 0 || course.genEds?.some((g) => selectedGenEd.includes(g))

      const matchesLevel =
        selectedLevel.length === 0 || (course.level && selectedLevel.includes(course.level))

      return matchesSearch && matchesSchool && matchesBreadth && matchesGenEd && matchesLevel
    })
  }, [courses, searchTerm, selectedSchool, selectedBreadth, selectedGenEd, selectedLevel])

  const activeFilterCount = selectedBreadth.length + selectedGenEd.length + selectedLevel.length

  const clearFilters = () => {
    setSelectedBreadth([])
    setSelectedGenEd([])
    setSelectedLevel([])
    setSelectedSchool("All Schools")
    setSearchTerm("")
    router.push("/courses")
  }

  // Update URL when search changes
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (selectedSchool !== "All Schools") params.set("school", selectedSchool)
    router.push(`/courses?${params.toString()}`)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Sidebar Filters */}
      <div className="w-full lg:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Filters</h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#c5050c] font-medium hover:underline"
            >
              Reset All
            </button>
          )}
        </div>

        {/* School Dropdown */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Department
          </label>
          <div className="relative">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-red-100 focus:border-[#c5050c] appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option>All Schools</option>
              {UW_SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school.replace(", School of", "").replace(", College of", "")}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Checkbox Sections */}
        <div className="space-y-1">
          <FilterSection
            title="Breadth"
            icon={Move}
            options={FILTER_OPTIONS.breadth}
            selected={selectedBreadth}
            onChange={(val) => toggleFilter(selectedBreadth, setSelectedBreadth, val)}
          />
          <FilterSection
            title="General Education"
            icon={GraduationCap}
            options={FILTER_OPTIONS.genEd}
            selected={selectedGenEd}
            onChange={(val) => toggleFilter(selectedGenEd, setSelectedGenEd, val)}
          />
          <FilterSection
            title="Level"
            icon={Layers}
            options={FILTER_OPTIONS.level}
            selected={selectedLevel}
            onChange={(val) => toggleFilter(selectedLevel, setSelectedLevel, val)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 w-full">
        {/* Search Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Course Catalog</h1>
              <p className="text-slate-500 text-sm mt-1">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#c5050c] transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#c5050c] transition-all"
                placeholder="Search by course code or name..."
              />
            </form>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.slice(0, 50).map((course) => (
            <Link
              key={course.code}
              href={`/courses/${encodeURIComponent(course.code)}`}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200 group-hover:bg-[#c5050c] group-hover:text-white group-hover:border-red-600 transition-colors">
                    {course.code}
                  </div>
                  {course.level && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                      {course.level}
                    </span>
                  )}
                </div>
                <Badge grade={GradeType.B} className="text-xs shadow-sm" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                {course.name}
              </h3>

              <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                <Book size={12} />
                <span className="truncate max-w-[200px]">{course.schoolName.split(",")[0]}</span>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {course.breadths?.slice(0, 2).map((b) => (
                  <span
                    key={b}
                    className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100"
                  >
                    {b}
                  </span>
                ))}
                {course.genEds?.slice(0, 1).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100"
                  >
                    {g.replace("Communication", "Comm").replace("Quantitative Reasoning", "Quant")}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                {course.description || "No description available."}
              </p>

              <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center text-xs">
                <span className="text-slate-400">{course.credits} credits</span>
                <div className="flex items-center gap-1 text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                  View Details
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}

          {filteredCourses.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="opacity-50" />
              </div>
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-sm">Try adjusting your search or clearing filters</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {filteredCourses.length > 50 && (
            <div className="col-span-full py-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm">
                Showing first 50 results. Use search or filters to narrow down.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
