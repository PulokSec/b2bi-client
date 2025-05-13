"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Star, Phone, Mail, Linkedin, Globe, MapPin, ChevronRight } from "lucide-react"
import { getBusinessesByQuery, getQueryById } from "@/lib/api"
import type { Business, SearchQuery } from "@/lib/types"

interface LeadsTableProps {
  queries: SearchQuery[]
}

export default function LeadsTable({ queries }: LeadsTableProps) {
  const searchParams = useSearchParams()
  const initialQueryId = searchParams.get("query")

  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(
    initialQueryId || (queries.length > 0 ? (queries[0]._id || queries[0].id || null) : null),
  )
  const [selectedQuery, setSelectedQuery] = useState<SearchQuery | null>(null)
  const [searchFilter, setSearchFilter] = useState("")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (initialQueryId) {
      setSelectedQueryId(initialQueryId)
    }
  }, [initialQueryId])

  useEffect(() => {
    const fetchQueryAndBusinesses = async () => {
      if (selectedQueryId) {
        setLoading(true)
        try {
          // Find the query in the list or fetch it
          const query =
            queries.find((q) => (q._id || q.id) === selectedQueryId) || (await getQueryById(selectedQueryId))

          if (query) {
            setSelectedQuery(query)
            const data = await getBusinessesByQuery(selectedQueryId)
            setBusinesses(data)
          }
        } catch (error) {
          console.error("Failed to fetch businesses:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchQueryAndBusinesses()
  }, [selectedQueryId, queries])

  const filteredBusinesses = businesses.filter((business) => {
    const searchTerms = searchFilter.toLowerCase()

    // Filter by search terms
    const matchesSearch =
      business.name?.toLowerCase().includes(searchTerms) ||
      business.formattedAddress?.toLowerCase().includes(searchTerms) ||
      business.primaryType?.toLowerCase().includes(searchTerms) ||
      business.emails?.some((email) => email.toLowerCase().includes(searchTerms)) ||
      business.gptInsights?.company?.name?.toLowerCase().includes(searchTerms) ||
      business.gptInsights?.["leadership/Managers/Administration"]?.some(
        (person) => person.name.toLowerCase().includes(searchTerms) || person.role?.toLowerCase().includes(searchTerms),
      ) ||
      business.gptInsights?.employees?.some(
        (person) => person.name.toLowerCase().includes(searchTerms) || person.role?.toLowerCase().includes(searchTerms),
      )

    // Filter by tab
    if (activeTab === "all") return matchesSearch
    if (activeTab === "highRated") return matchesSearch && (business.rating || 0) >= 4.5
    if (activeTab === "withWebsite") return matchesSearch && !!business.websiteUri
    if (activeTab === "withEmail") return matchesSearch && (business.emails?.length || 0) > 0

    return matchesSearch
  })

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar with queries */}
        <div className="w-full md:w-64 bg-gray-50 rounded-lg overflow-hidden">
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <h3 className="font-medium text-blue-800">Search Queries</h3>
          </div>
          <div className="flex flex-col">
  {queries
    .slice() // Create a copy to avoid mutating original array
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Descending sort
    .map((query) => (
      <button
        key={query._id || query.id}
        className={`p-4 text-left hover:bg-blue-50 transition-colors ${
          selectedQueryId === (query._id || query.id) ? "bg-blue-100 border-l-4 border-blue-600" : ""
        }`}
        onClick={() => setSelectedQueryId(query._id || query.id || null)}
      >
        <div className="font-medium">{query.searchText}</div>
        <div className="text-xs text-gray-500 mt-1">{new Date(query.createdAt).toLocaleDateString()}</div>
      </button>
    ))}
</div>
        </div>

        {/* Main content with leads table */}
        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-800">{selectedQuery?.searchText || "Leads"}</h2>
            <p className="text-gray-500 mt-1">{selectedQuery && new Date(selectedQuery.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search leads..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="flex-1"
            />

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="highRated">High Rated</TabsTrigger>
                <TabsTrigger value="withWebsite">With Website</TabsTrigger>
                <TabsTrigger value="withEmail">With Email</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-600">Loading leads...</span>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center p-12 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium">No leads found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters to find more results.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBusinesses.map((business) => (
                <Card key={business._id || business.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{business.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {business.formattedAddress}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        {business.rating && (
                          <Badge variant="outline" className="flex items-center gap-1 mr-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {business.rating.toFixed(1)} ({business.userRatingCount})
                          </Badge>
                        )}
                        {business.primaryType && <Badge variant="secondary">{business.primaryType}</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                        <div className="space-y-2">
                          {business.nationalPhoneNumber && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-blue-600" />
                              <span>{business.nationalPhoneNumber}</span>
                            </div>
                          )}
                          {business.emails && business.emails.length > 0 && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-blue-600" />
                              <span>{business.emails[0]}</span>
                            </div>
                          )}
                          {business.websiteUri && (
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-blue-600" />
                              <a
                                href={business.websiteUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                {business.websiteUri.replace(/^https?:\/\//, "").split("/")[0]}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}
                          {business.linkedIn && (
                            <div className="flex items-center">
                              <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                              <a
                                href={business.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                LinkedIn Profile
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Key People</h3>
                        <div className="space-y-2">
                          {business.gptInsights?.["leadership/Managers/Administration"]?.map((person, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{person.name}</div>
                              <div className="text-gray-500">{person.role}</div>
                            </div>
                          ))}
                          {business.gptInsights?.employees?.slice(0, 2).map((person, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{person.name}</div>
                              <div className="text-gray-500">{person.role}</div>
                            </div>
                          ))}
                          {!business.gptInsights?.employees?.length && (
                            <div className="text-gray-500 text-sm">No key people information available</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Founding Year</h3>
                        <div className="space-y-2">

                            <div className="text-sm">
                              <div className="font-medium">{business.gptInsights?.company?.foundingYear || "Not Available"}</div>
                            </div>
                        </div>
                      </div>
                    </div>

                    {business.websiteInfo && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-medium text-gray-900 mb-3">Website Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-xs text-gray-500">Status</div>
                            <div className="font-medium">{business.websiteInfo.websiteStatus || "Unknown"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-xs text-gray-500">SSL</div>
                            <div className="font-medium">{business.websiteInfo.hasSSL ? "Secure" : "Not Secure"}</div>
                          </div>
                          {business.websiteInfo.pageSpeed?.performance && (
                            <div className="bg-gray-50 p-3 rounded">
                              <div className="text-xs text-gray-500">Site Performance</div>
                              <div className="font-medium">
                                {Math.round(business.websiteInfo.pageSpeed.performance)}%
                              </div>
                            </div>
                          )}
                          {business.websiteInfo.pageSpeed?.load_time && (
                            <div className="bg-gray-50 p-3 rounded">
                              <div className="text-xs text-gray-500">Site Load Time</div>
                              <div className="font-medium">
                                {(business.websiteInfo.pageSpeed.load_time / 1000).toFixed(1)}s
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-medium text-gray-900 mb-3">Strategical Score</h3> 
                      <p className="font-medium text-gray-900 mb-3">{business?.score?.generalParameters || 0} %</p> 

                    </div>
                    <div className="mt-6 flex justify-end">
                      <Link href={`/business/${business._id || business.id}`}>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 flex items-center">
                          View Full Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
