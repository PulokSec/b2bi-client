"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getProcessingStatus } from "@/lib/api"

export default function ProcessingStatus() {
  const [processingQueries, setProcessingQueries] = useState<
    { query: string; progress: number; timeRemaining: number }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const status = await getProcessingStatus()

        // Transform the data for display
        const queries = status.queries.map((query: string) => ({
          query,
          progress: Math.floor(Math.random() * 90) + 10, // Simulate progress
          timeRemaining: Math.floor(Math.random() * 60) + 10, // Simulate time remaining
        }))

        setProcessingQueries(queries)
      } catch (error) {
        console.error("Failed to fetch processing status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-blue-600">Currently Processing</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading processing status...</p>
        ) : processingQueries.length > 0 ? (
          <div className="space-y-4">
            {processingQueries.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.query}</span>
                  <span className="text-sm text-gray-500">{item.timeRemaining}s remaining</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <p className="italic text-gray-500">No keywords currently being processed.</p>
        )}
      </CardContent>
    </Card>
  )
}
