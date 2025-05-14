/* Optimized SearchForm Component */
"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
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

const STAGES = [
  "Gathering business information...",
  "Extracting key data from sources...",
  "Analyzing with insights using AI...",
  "Finalizing your results...",
]

export default function SearchForm() {
  const [searchText, setSearchText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("Processing...")
  const [estimatedTime, setEstimatedTime] = useState(900)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [recentQueries, setRecentQueries] = useState<SearchQuery[]>([])
  const [isLoadingQueries, setIsLoadingQueries] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const pendingSearches = usePendingSearches()

  useEffect(() => {
    if (!isOnline) return

    const fetchRecentQueries = async () => {
      setIsLoadingQueries(true)
      try {
        const queries = await getSearchQueries()
        setRecentQueries(
          queries
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        )
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

    const stageCount = STAGES.length
    const stageDuration = estimatedTime / stageCount
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newStage = Math.min(Math.floor(elapsed / stageDuration), stageCount - 1)
      setCurrentStage(newStage)
      setProgress(Math.min(Math.floor((elapsed / estimatedTime) * 100), 99))
      setProgressMessage(STAGES[newStage])
    }, 1000)

    return () => clearInterval(interval)
  }, [isProcessing, estimatedTime])

  useEffect(() => {
    if (!isOnline || !pendingSearches.some(s => s.status === "pending")) return

    const run = async () => {
      toast({ title: "Processing pending searches", description: "Saved searches are processing now" })
      await processPendingSearches(async (text) => {
        toast({ title: "Processing", description: `Processing '${text}'...` })
        await searchBusinesses(text)
        toast({ title: "Done", description: `Results for '${text}' ready.` })
      })
    }

    run()
  }, [isOnline, pendingSearches, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchText.trim()) {
      toast({ title: "Search field is empty", description: "Enter a keyword", variant: "destructive" })
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
      toast({ title: "You're offline", description: "Search saved for later" })
      setIsLoading(false)
      setIsProcessing(false)
      setSearchText("")
      return
    }

    try {
      const response = await searchBusinesses(searchText)
      setEstimatedTime(response.estimatedTime || 900)
      const queries = await getSearchQueries()
      setSearchId(queries.find(q => q.searchText === response.query)?._id || null)
      setRecentQueries(
        queries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      )
      setProgress(100)
      toast({ title: "Search complete", description: `Results for "${searchText}" ready.` })
    } catch {
      toast({ title: "Search failed", description: "Error occurred", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  const formatDate = useCallback((date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hr ago`
    const days = Math.floor(hrs / 24)
    return days < 7 ? `${days} day ago` : d.toLocaleDateString()
  }, [])

  const formatRemainingTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}h ${m}m ${s}s`
  }, [])

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
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Get me fresh leads"}
        </Button>
      </form>

      {recentQueries.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center mb-2 text-sm text-gray-500">
            <History className="h-4 w-4 mr-1" />
            <span>Recent Searches</span>
          </div>
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
                Step {currentStage + 1} of {STAGES.length}: {progressMessage}
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
                <Button onClick={() => router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)} className="bg-green-600 hover:bg-green-700 text-white">
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
