"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Megaphone, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/announcements", icon: Megaphone, label: "News" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-white pb-[env(safe-area-inset-bottom)] z-50">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around px-2">
        {navItems.map((item, index) => {
          const isActive = (item.label === "Home" && pathname === "/dashboard") ||
                           (item.label !== "Home" && pathname.startsWith(item.href))

          return (
            <Link 
              key={index} 
              href={item.href} 
              className="relative flex flex-col items-center justify-center w-full h-full gap-1"
            >
              {isActive && (
                <div className="absolute top-0 left-[20%] right-[20%] h-[3px] bg-[#3B82F6] rounded-b-full" />
              )}
              <item.icon
                className={cn(
                  "h-[24px] w-[24px] transition-colors", 
                  isActive ? "text-[#3B82F6]" : "text-[#9CA3AF]"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors", 
                  isActive ? "text-[#3B82F6]" : "text-[#9CA3AF]"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
