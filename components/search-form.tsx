"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { searchBusinesses, getSearchQueries } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, WifiOff, CheckCircle2, Search, History } from "lucide-react"
import { useOnlineStatus, usePendingSearches, savePendingSearch, processPendingSearches } from "@/lib/offline-utils"
import type { SearchQuery } from "@/lib/types"

export default function SearchForm() {
  const [searchText, setSearchText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(60) // Default 60 seconds
  const [searchId, setSearchId] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<SearchQuery[]>([])
  const [isLoadingQueries, setIsLoadingQueries] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const pendingSearches = usePendingSearches()

  // Fetch recent queries
  useEffect(() => {
    const fetchRecentQueries = async () => {
      if (!isOnline) return

      setIsLoadingQueries(true)
      try {
        const queries = await getSearchQueries()
        // Sort by date (newest first) and take the 5 most recent
        const sortedQueries = queries
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setRecentQueries(sortedQueries)
      } catch (error) {
        console.error("Failed to fetch recent queries:", error)
      } finally {
        setIsLoadingQueries(false)
      }
    }

    fetchRecentQueries()
  }, [isOnline])

  // Simulate progress when processing
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isProcessing) {
      const startTime = Date.now()
      const totalTime = estimatedTime * 1000 // convert to ms

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const newProgress = Math.min(Math.floor((elapsed / totalTime) * 100), 99)

        setProgress(newProgress)

        // If we're at 99%, we'll wait for the actual completion
        if (newProgress >= 99) {
          clearInterval(interval)

          // Simulate completion after a short delay if not already completed
          setTimeout(() => {
            if (isProcessing) {
              setIsProcessing(false)
              setProgress(100)
            }
          }, 3000)
        }
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, estimatedTime])

  // Process pending searches when coming back online
  useEffect(() => {
    if (isOnline && pendingSearches.some((search) => search.status === "pending")) {
      const processSearches = async () => {
        toast({
          title: "Processing pending searches",
          description: "Your saved searches are being processed now that you're online",
        })

        await processPendingSearches(async (searchText) => {
          toast({
            title: "Processing search",
            description: `Processing "${searchText}" in background...`,
          })

          const result = await searchBusinesses(searchText)

          toast({
            title: "Search complete",
            description: `Results for "${searchText}" are ready to view`,
          })

          return result
        })
      }

      processSearches()
    }
  }, [isOnline, pendingSearches, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchText.trim()) {
      toast({
        title: "Search field is empty",
        description: "Please enter a keyword to search for businesses",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // If offline, save the search for later processing
    if (!isOnline) {
      const id = savePendingSearch(searchText)
      setSearchId(id)

      toast({
        title: "You're offline",
        description: "Your search has been saved and will be processed when you're back online",
      })

      setIsLoading(false)
      setSearchText("")
      return
    }

    try {
      toast({
        title: "Processing search",
        description: `Searching for "${searchText}"...`,
      })

      // Start the search process
      const response = await searchBusinesses(searchText)

      // Set processing state
      setIsProcessing(true)
      setSearchId(response.id || null)
      setEstimatedTime(response.estimatedTime || 60) // Use API response or default to 60 seconds

      // Refresh recent queries
      const queries = await getSearchQueries()
      const sortedQueries = queries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setRecentQueries(sortedQueries)

      // After a simulated delay (in a real app, you'd poll the API for status)
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(100)

        toast({
          title: "Search complete",
          description: `Results for "${searchText}" are ready to view`,
        })
      }, 10000) // Simulate 10 seconds of processing
    } catch (error) {
      toast({
        title: "Search failed",
        description: "An error occurred while processing your search",
        variant: "destructive",
      })
      setIsLoading(false)
      setIsProcessing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecentQueryClick = async (query: SearchQuery) => {
    if (isLoading || isProcessing) return

    setSearchText(query.searchText)

    // Option 1: Auto-submit the form with the selected query
    // handleSubmit(new Event('submit') as any);

    // Option 2: Just navigate to the results
    router.push(`/my-leads?query=${query._id || query.id}`)
  }

  const handleViewResults = () => {
    router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center text-amber-800 mb-4">
          <WifiOff className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">You're offline</p>
            <p className="text-sm">Searches will be saved and processed when you're back online.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          type="text"
          placeholder="e.g., Plumber in Regina"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1"
          disabled={isLoading || isProcessing}
        />
        <Button type="submit" disabled={isLoading || isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Get me fresh leads"
          )}
        </Button>
      </form>

      {/* Recent Searches */}
      {recentQueries.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center mb-2 text-sm text-gray-500">
            <History className="h-4 w-4 mr-1" />
            <span>Recent Searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentQueries.map((query) => (
              <button
                key={query._id || query.id}
                onClick={() => handleRecentQueryClick(query)}
                disabled={isLoading || isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="truncate max-w-[150px]">{query.searchText}</span>
                <span className="text-xs text-gray-500">{formatDate(query.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Processing "{searchText}"</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.floor(estimatedTime - (estimatedTime * progress) / 100 + 1)} seconds remaining
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                We're searching for businesses and enriching the data. This may take a minute.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {progress === 100 && !isProcessing && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleViewResults} className="bg-green-600 hover:bg-green-700 text-white">
            View Results
          </Button>
        </div>
      )}

      {/* Pending Searches Section */}
      {pendingSearches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Pending Searches</h3>
          <div className="space-y-3">
            {pendingSearches.map((search) => (
              <Card key={search.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{search.searchText}</p>
                      <p className="text-sm text-gray-500">{new Date(search.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center">
                      {search.status === "pending" && !isOnline && (
                        <span className="text-amber-600 text-sm flex items-center">
                          <WifiOff className="h-4 w-4 mr-1" /> Waiting for connection
                        </span>
                      )}
                      {search.status === "pending" && isOnline && (
                        <span className="text-blue-600 text-sm flex items-center">
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Queued
                        </span>
                      )}
                      {search.status === "processing" && (
                        <span className="text-blue-600 text-sm flex items-center">
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing
                        </span>
                      )}
                      {search.status === "completed" && (
                        <span className="text-green-600 text-sm flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                        </span>
                      )}
                      {search.status === "failed" && <span className="text-red-600 text-sm">Failed</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
