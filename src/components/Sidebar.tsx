"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BookOpen,
  Star,
  MessageSquare,
  LayoutGrid,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { UW_SCHOOLS } from "@/lib/constants"
import { signOut } from "next-auth/react"

interface NavItemProps {
  icon: React.ElementType
  label: string
  href: string
  active: boolean
}

function NavItem({ icon: Icon, label, href, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
        active
          ? "bg-red-50 text-[#c5050c] shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon
        size={18}
        className={`transition-colors ${
          active ? "text-[#c5050c]" : "text-slate-400 group-hover:text-slate-600"
        }`}
      />
      <span>{label}</span>
    </Link>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const [showAllSchools, setShowAllSchools] = useState(false)

  const visibleSchools = showAllSchools ? UW_SCHOOLS : UW_SCHOOLS.slice(0, 6)

  const navItems = [
    { icon: Home, label: "Overview", href: "/" },
    { icon: BookOpen, label: "Courses", href: "/courses" },
  ]

  const collectionItems = [
    { icon: Star, label: "Favourites", href: "/favourites" },
    { icon: LayoutGrid, label: "My Courses", href: "/my-courses" },
    { icon: MessageSquare, label: "My Reviews", href: "/my-reviews" },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
        ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Platform
          </div>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}

          <div className="mt-8 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Collection
          </div>
          {collectionItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}

          <div className="mt-8 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Departments
          </div>
          <div className="space-y-0.5">
            {visibleSchools.map((school) => (
              <Link
                key={school}
                href={`/courses?school=${encodeURIComponent(school)}`}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-600 hover:text-[#c5050c] hover:bg-slate-50 rounded-md group text-left transition-colors"
                title={school}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#c5050c] transition-colors flex-shrink-0"></div>
                  <span className="truncate">
                    {school.replace(", School of", "").replace(", College of", "")}
                  </span>
                </div>
              </Link>
            ))}

            <button
              onClick={() => setShowAllSchools(!showAllSchools)}
              className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {showAllSchools ? (
                <>
                  <ChevronUp size={14} />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Show All Schools
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-slate-900 w-full px-2 py-1 transition-colors"
          >
            <LogOut size={18} className="text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
