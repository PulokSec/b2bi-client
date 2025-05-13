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
  const [progressMessage, setProgressMessage] = useState("Processing...")
  const [estimatedTime, setEstimatedTime] = useState(900) // 15 minutes max default
  const [searchId, setSearchId] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<SearchQuery[]>([])
  const [isLoadingQueries, setIsLoadingQueries] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const pendingSearches = usePendingSearches()

  const processingStages = [
    "Gathering business information...",
    "Extracting key data from sources...",
    "Analyzing with insights using AI...",
    "Finalizing your results...",
  ]

  useEffect(() => {
    const fetchRecentQueries = async () => {
      if (!isOnline) return
      setIsLoadingQueries(true)
      try {
        const queries = await getSearchQueries()
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

  useEffect(() => {
    if (!isProcessing) return

    const stageCount = processingStages.length
    const totalTime = estimatedTime
    const stageDuration = totalTime / stageCount // seconds per stage
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const currentStageIndex = Math.min(Math.floor(elapsedSeconds / stageDuration), stageCount - 1)
      const newProgress = Math.min(Math.floor((elapsedSeconds / totalTime) * 100), 99)

      setCurrentStage(currentStageIndex)
      setProgress(newProgress)
      setProgressMessage(processingStages[currentStageIndex])
    }, 1000)

    return () => clearInterval(interval)
  }, [isProcessing, estimatedTime])

  useEffect(() => {
    if (isOnline && pendingSearches.some((s) => s.status === "pending")) {
      const processSearches = async () => {
        toast({
          title: "Processing pending searches",
          description: "Your saved searches are being processed now that you're online",
        })

        await processPendingSearches(async (searchText) => {
          toast({ title: "Processing search", description: `Processing "${searchText}"...` })
          await searchBusinesses(searchText)
          toast({ title: "Search complete", description: `Results for "${searchText}" are ready to view` })
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
    setIsProcessing(true)
    setProgress(0)
    setProgressMessage("Processing...")
    setEstimatedTime(900)
    setCurrentStage(0)

    if (!isOnline) {
      const id = savePendingSearch(searchText)
      setSearchId(id)
      toast({
        title: "You're offline",
        description: "Your search has been saved and will be processed when you're back online",
      })
      setIsLoading(false)
      setIsProcessing(false)
      setSearchText("")
      return
    }

    try {
      const response = await searchBusinesses(searchText)
      setEstimatedTime(response.estimatedTime || 900)

      const queries = await getSearchQueries()
      const queryId = queries.find((q) => q.searchText === response.query)?._id || null
      setSearchId(queryId)

      const sortedQueries = queries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setRecentQueries(sortedQueries)

      setProgress(100)
      setIsProcessing(false)
      toast({
        title: "Search complete",
        description: `Results for "${searchText}" are ready to view`,
      })
    } catch (error) {
      toast({
        title: "Search failed",
        description: "An error occurred while processing your search",
        variant: "destructive",
      })
      setIsProcessing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewResults = () => {
    router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)
  }

  const handleRecentQueryClick = (query: SearchQuery) => {
    if (isLoading || isProcessing) return
    setSearchText(query.searchText)
    router.push(`/my-leads?query=${query._id || query.id}`)
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

  const formatRemainingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours}h ${minutes}m ${seconds}s`
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

      <form onSubmit={handleSubmit} className="flex gap-4 md:flex-row flex-col">
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
                <h3 className="font-medium">{progressMessage}</h3>
                <span className="text-sm text-muted-foreground">
                  {formatRemainingTime(Math.max(1, Math.floor(estimatedTime - (estimatedTime * progress) / 100)))}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Step {currentStage + 1} of {processingStages.length}: {progressMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {progress === 100 && !isProcessing && (
        <Card className="mt-10">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-medium text-center">Processing Completed For "{searchText}"</h3>
              <p className="text-sm text-muted-foreground text-center">
                You can now view your search results in the "My Leads" section.
              </p>
              <div className="flex justify-center mt-6">
                <Button onClick={handleViewResults} className="bg-green-600 hover:bg-green-700 text-white">
                  View Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
