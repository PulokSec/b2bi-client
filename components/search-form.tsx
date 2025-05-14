"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Loader2, WifiOff, CheckCircle2, Search, History } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useOnlineStatus, usePendingSearches, savePendingSearch, processPendingSearches } from "@/lib/offline-utils"
import { searchBusinesses, getSearchQueries } from "@/lib/api"
import type { SearchQuery } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function SearchForm() {
    const [searchText, setSearchText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("Processing...")
  const [estimatedTime, setEstimatedTime] = useState(900)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<SearchQuery[]>([])
  const [isLoadingQueries, setIsLoadingQueries] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const pendingSearches = usePendingSearches()

  const processingStages = useMemo(() => [
    "Gathering business information...",
    "Extracting key data from sources...",
    "Analyzing with insights using AI...",
    "Finalizing your results...",
  ], [])

  useEffect(() => {
    const fetchRecentQueries = async () => {
      if (!isOnline) return
      setIsLoadingQueries(true)
      try {
        const queries = await getSearchQueries()
        const sorted = queries
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
        setRecentQueries(sorted)
      } catch {
        console.error("Failed to fetch recent queries")
      } finally {
        setIsLoadingQueries(false)
      }
    }
    fetchRecentQueries()
  }, [isOnline])

  useEffect(() => {
    if (!isProcessing) return

    let frameId: number
    let intervalId: NodeJS.Timeout
    const stageCount = processingStages.length
    const totalTime = estimatedTime
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const currentStageIndex = Math.min(Math.floor(elapsed / (totalTime / stageCount)), stageCount - 1)
      const newProgress = Math.min(Math.floor((elapsed / totalTime) * 100), 99)

      setCurrentStage(currentStageIndex)
      setProgress(newProgress)
      setProgressMessage(processingStages[currentStageIndex])
    }

    intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      updateProgress()
    }, 1000)

    frameId = requestAnimationFrame(updateProgress)

    return () => {
      cancelAnimationFrame(frameId)
      clearInterval(intervalId)
      setElapsedTime(0)
    }
  }, [isProcessing, estimatedTime, processingStages])

  useEffect(() => {
    if (isOnline && pendingSearches.some(s => s.status === "pending")) {
      const run = async () => {
        toast({ title: "Processing pending searches", description: "Saved searches are now being processed" })
        await processPendingSearches(async (text) => {
          toast({ title: "Processing search", description: `Processing "${text}"...` })
          await searchBusinesses(text)
          toast({ title: "Search complete", description: `Results for "${text}" are ready` })
        })
      }
      run()
    }
  }, [isOnline, pendingSearches, toast])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchText.trim()) {
      toast({ title: "Search field is empty", description: "Please enter a keyword", variant: "destructive" })
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
      toast({ title: "You're offline", description: "Search will be processed once back online" })
      setIsLoading(false)
      setIsProcessing(false)
      setSearchText("")
      return
    }

    try {
      const response = await searchBusinesses(searchText)
      setEstimatedTime(response.estimatedTime || 900)
      const queries = await getSearchQueries()
      const queryId = queries.find(q => q.searchText === response.query)?._id || null
      setSearchId(queryId)
      setRecentQueries(queries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5))
      setProgress(100)
      setIsProcessing(false)
      toast({ title: "Search complete", description: `Results for "${searchText}" are ready` })
    } catch {
      toast({ title: "Search failed", description: "An error occurred", variant: "destructive" })
      setIsProcessing(false)
    } finally {
      setIsLoading(false)
    }
  }, [searchText, isOnline, toast, router])

  const handleViewResults = useCallback(() => {
    router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)
  }, [router, searchId])

  const handleRecentQueryClick = useCallback((query: SearchQuery) => {
    if (isLoading || isProcessing) return
    setSearchText(query.searchText)
    router.push(`/my-leads?query=${query._id || query.id}`)
  }, [isLoading, isProcessing, router])

  const formatDate = useCallback((dateString: string) => {
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
  }, [])

  const formatRemainingTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours}h ${minutes}m ${seconds}s`
  }, [])

  return (
  <div className="p-4 space-y-6">
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Search for businesses..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        disabled={isLoading || isProcessing}
      />
      <Button type="submit" disabled={isLoading || isProcessing}>
        {isLoading ? <Loader2 className="animate-spin" /> : <Search className="mr-1" />} Generate Fresh Leads
      </Button>
    </form>

    {!isOnline && (
      <div className="text-sm text-orange-600 flex items-center gap-2">
        <WifiOff size={16} />
        You're offline. Searches will be saved and processed when back online.
      </div>
    )}

    {isProcessing && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{progressMessage}</h3>
                <span className="text-sm text-muted-foreground">
                  Elapsed: {formatRemainingTime(elapsedTime)}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

    {/* {searchId && !isProcessing && (
      <Button variant="secondary" onClick={handleViewResults}>
        <CheckCircle2 className="mr-2" /> View Results
      </Button>
    )} */}
    {progress === 100 && !isProcessing && (
        <Card className="mt-10">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-medium text-center">Processing Completed For "{searchText}"</h3>
              <p className="text-sm text-muted-foreground text-center">
                You can now view your search results in the "My Leads" section.
              </p>
              <div className="flex justify-center mt-6">
                <Button onClick={() => router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)} className="bg-green-600 hover:bg-green-700 text-white">
                  View Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <History size={18} /> Recent Searches
      </h3>
      {isLoadingQueries ? (
        <div className="text-gray-500 text-sm">Loading recent queries...</div>
      ) : (
        <div className="flex flex-wrap gap-2">
            {recentQueries.map((q) => (
              <button
                key={q._id || q.id}
                onClick={() => router.push(`/my-leads?query=${q._id || q.id}`)}
                disabled={isLoading || isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="truncate max-w-[150px]">{q.searchText}</span>
                <span className="text-xs text-gray-500">{formatDate(q.createdAt)}</span>
              </button>
            ))}
          </div>
      )}
    </div>
  </div>
)

}
