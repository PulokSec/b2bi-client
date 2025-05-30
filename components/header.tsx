"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth"

export default function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between mx-auto px-5 md:sticky fixed top-0 bg-white z-50">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="B2Bi Logo" width={100} height={40} priority />
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/configure-leads" className="text-sm font-medium transition-colors hover:text-primary">
            Configure Leads
          </Link>
          <Link href="/my-leads" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800">
            My Leads
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
