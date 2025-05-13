"use client"

import { useEffect, useState } from "react"

// Type for pending searches
export interface PendingSearch {
  id: string
  searchText: string
  timestamp: number
  status: "pending" | "processing" | "completed" | "failed"
}

// Save a pending search to local storage
export function savePendingSearch(searchText: string): string {
  if (typeof window === "undefined") return ""

  const id = `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const pendingSearch: PendingSearch = {
    id,
    searchText,
    timestamp: Date.now(),
    status: "pending",
  }

  const pendingSearches = getPendingSearches()
  pendingSearches.push(pendingSearch)
  localStorage.setItem("pendingSearches", JSON.stringify(pendingSearches))

  return id
}

// Get all pending searches from local storage
export function getPendingSearches(): PendingSearch[] {
  if (typeof window === "undefined") return []

  try {
    const storedSearches = localStorage.getItem("pendingSearches")
    return storedSearches ? JSON.parse(storedSearches) : []
  } catch (error) {
    console.error("Error getting pending searches:", error)
    return []
  }
}

// Update the status of a pending search
export function updatePendingSearchStatus(id: string, status: PendingSearch["status"]): void {
  if (typeof window === "undefined") return

  try {
    const pendingSearches = getPendingSearches()
    const updatedSearches = pendingSearches.map((search) => (search.id === id ? { ...search, status } : search))
    localStorage.setItem("pendingSearches", JSON.stringify(updatedSearches))

    // Dispatch a custom event to notify components about the update
    window.dispatchEvent(new CustomEvent("pendingSearchesUpdated"))
  } catch (error) {
    console.error("Error updating pending search status:", error)
  }
}

// Remove a pending search from local storage
export function removePendingSearch(id: string): void {
  if (typeof window === "undefined") return

  try {
    const pendingSearches = getPendingSearches()
    const updatedSearches = pendingSearches.filter((search) => search.id !== id)
    localStorage.setItem("pendingSearches", JSON.stringify(updatedSearches))

    // Dispatch a custom event to notify components about the update
    window.dispatchEvent(new CustomEvent("pendingSearchesUpdated"))
  } catch (error) {
    console.error("Error removing pending search:", error)
  }
}

// Custom hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

// Custom hook for pending searches
export function usePendingSearches() {
  const [pendingSearches, setPendingSearches] = useState<PendingSearch[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Initial load
    setPendingSearches(getPendingSearches())

    // Set up custom event listener to update when changes occur
    const handlePendingSearchesUpdated = () => {
      setPendingSearches(getPendingSearches())
    }

    window.addEventListener("pendingSearchesUpdated", handlePendingSearchesUpdated)

    // Poll for changes every second (as a fallback)
    const interval = setInterval(() => {
      setPendingSearches(getPendingSearches())
    }, 1000)

    return () => {
      window.removeEventListener("pendingSearchesUpdated", handlePendingSearchesUpdated)
      clearInterval(interval)
    }
  }, [])

  return pendingSearches
}

// Process pending searches when online
export async function processPendingSearches(searchCallback: (searchText: string) => Promise<any>) {
  if (typeof window === "undefined") return

  const pendingSearches = getPendingSearches().filter((search) => search.status === "pending")

  for (const search of pendingSearches) {
    try {
      updatePendingSearchStatus(search.id, "processing")

      await searchCallback(search.searchText)

      updatePendingSearchStatus(search.id, "completed")
    } catch (error) {
      console.error(`Error processing search "${search.searchText}":`, error)
      updatePendingSearchStatus(search.id, "failed")
    }
  }
}
