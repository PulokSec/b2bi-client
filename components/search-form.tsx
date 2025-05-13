"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { searchBusinesses } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, WifiOff, CheckCircle2 } from "lucide-react"
import {
  useOnlineStatus,
  usePendingSearches,
  savePendingSearch,
  processPendingSearches,
} from "@/lib/offline-utils"

export default function SearchForm() {
  const [searchText, setSearchText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(60)
  const [searchId, setSearchId] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const pendingSearches = usePendingSearches()

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    let startTime: number

    if (isProcessing) {
      startTime = Date.now()
      const totalTime = estimatedTime * 1000

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const percent = Math.min(Math.floor((elapsed / totalTime) * 100), 99)
        setProgress(percent)

        if (percent >= 99) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            setProgress(100)
          }, 1000)
        }
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, estimatedTime])

  // Reprocess saved searches when back online
  useEffect(() => {
    if (isOnline && pendingSearches.some((s: any) => s.status === "pending")) {
      const processSearches = async () => {
        toast({
          title: "Processing pending searches",
          description: "Your saved searches are being processed now that you're online",
        })

        await processPendingSearches(async (searchText: any) => {
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

      const start = performance.now()
      const response = await searchBusinesses(searchText)
      const end = performance.now()

      const apiDelay = Math.ceil((end - start) / 1000) || 10
      const bufferTime = 5
      const totalEstimate = apiDelay + bufferTime

      setIsProcessing(true)
      setEstimatedTime(totalEstimate)
      setProgress(0)
      setSearchId(response.id || null)
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

  const handleViewResults = () => {
    router.push(`/my-leads${searchId ? `?query=${searchId}` : ""}`)
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

      {isProcessing && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Processing "{searchText}"</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.max(1, Math.floor(estimatedTime - (estimatedTime * progress) / 100))} seconds remaining
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

      {pendingSearches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Pending Searches</h3>
          <div className="space-y-3">
            {pendingSearches.map((search: any) => (
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
