"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, Bell, User, Menu } from "lucide-react"
import { Logo } from "./ui/Logo"
import Link from "next/link"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-900 p-1 hover:bg-slate-100 rounded"
        >
          <Menu size={24} />
        </button>

        <Link
          href="/"
          className="flex items-center gap-3 select-none cursor-pointer group"
        >
          <Logo className="transition-transform group-hover:rotate-3" size={36} />
          <div className="flex flex-col justify-center">
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              Wisc<span className="text-[#c5050c]">Flow</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mt-0.5">
              UW Madison
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden md:block group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#c5050c] transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-64 lg:w-80 pl-10 pr-3 py-1.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-[#c5050c] sm:text-sm transition-all"
            placeholder="Jump to course..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <kbd className="inline-flex items-center border border-slate-200 rounded px-2 text-[10px] font-sans font-medium text-slate-400">
              /
            </kbd>
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-700 transition-colors relative p-2 hover:bg-slate-50 rounded-full">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 block h-2 w-2 rounded-full ring-2 ring-white bg-[#c5050c]"></span>
          </button>
          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
          <Link
            href="/my-courses"
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 p-1 pr-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-full flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-slate-500" />
              )}
            </div>
            <span className="hidden md:block">
              {session?.user?.name || "My Account"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
