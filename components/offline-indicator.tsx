"use client"

import { useOnlineStatus } from "@/lib/offline-utils"
import { WifiOff } from "lucide-react"

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-lg flex items-center z-50">
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="font-medium">You're offline</span>
    </div>
  )
}
