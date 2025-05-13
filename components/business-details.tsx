"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Star,
  Users,
  FileText,
  ExternalLink,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
} from "lucide-react"
import type { Business } from "@/lib/types"

interface BusinessDetailsProps {
  business: Business
}

export default function BusinessDetails({ business }: BusinessDetailsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const handleBack = () => {
    router.back()
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }
  console.log(business?.gptInsights)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
            <div className="flex items-center mt-2 text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{business.formattedAddress || "No address available"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {business.businessStatus && (
              <Badge variant={business.businessStatus === "OPERATIONAL" ? "success" : "secondary"}>
                {business.businessStatus}
              </Badge>
            )}
            {business.primaryType && <Badge variant="outline">{business.primaryType}</Badge>}
            {business.rating && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {business.rating.toFixed(1)} ({business.userRatingCount || 0})
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Name</p>
                    <p className="text-gray-900">{business.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Type</p>
                    <p className="text-gray-900">{business.primaryType || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-gray-900">{business.businessStatus || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rating</p>
                    <div className="flex items-center">
                      {business.rating ? (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>
                            {business.rating.toFixed(1)} ({business.userRatingCount || 0} reviews)
                          </span>
                        </>
                      ) : (
                        "No ratings"
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                  <p className="text-gray-900">{business.formattedAddress || "No address available"}</p>
                </div>

                {business.gptInsights && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">AI Insights</p>
                    <div className="bg-blue-50 p-4 rounded-md text-gray-700">
                      {typeof business.gptInsights === "string" ? (
                        <p>{business.gptInsights}</p>
                      ) : (
                        <p>
                          {business.gptInsights.company?.name || business.name} was founded in{" "}
                          {business.gptInsights.company?.foundingYear || "N/A"} and has established a presence in the{" "}
                          {business.primaryType || "business"} industry.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.nationalPhoneNumber && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-blue-600" />
                    <a href={`tel:${business.nationalPhoneNumber}`} className="text-gray-900 hover:text-blue-600">
                      {business.nationalPhoneNumber}
                    </a>
                  </div>
                )}

                {business.emails && business.emails.length > 0 && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-blue-600" />
                    <a href={`mailto:${business.emails[0]}`} className="text-gray-900 hover:text-blue-600 truncate">
                      {business.emails[0]}
                    </a>
                  </div>
                )}

                {business.websiteUri && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-3 text-blue-600" />
                    <a
                      href={business.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 truncate flex items-center"
                    >
                      {business.websiteUri.replace(/^https?:\/\//, "").split("/")[0]}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}

                {business.linkedIn && (
                  <div className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-3 text-blue-600" />
                    <a
                      href={business.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 flex items-center"
                    >
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}

                {business.googleMapsUri && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-blue-600" />
                    <a
                      href={business.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 flex items-center"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t">
                  <Button className="w-full">Add to CRM</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Types and Categories */}
          {business.types && business.types.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Business Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {business.types.map((type, index) => (
                    <Badge key={index} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Added Date Information */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Added to Database</p>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(business.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(business.updatedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Search Query</p>
                <p className="text-gray-900 italic">{business.searchText || "Unknown"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Phone Numbers</h3>
                  {business.nationalPhoneNumber ? (
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Main Phone</p>
                          <a href={`tel:${business.nationalPhoneNumber}`} className="text-blue-600 hover:underline">
                            {business.nationalPhoneNumber}
                          </a>
                        </div>
                      </div>
                      {business.internationalPhoneNumber &&
                        business.internationalPhoneNumber !== business.nationalPhoneNumber && (
                          <div className="flex items-start">
                            <Phone className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium">International</p>
                              <a
                                href={`tel:${business.internationalPhoneNumber}`}
                                className="text-blue-600 hover:underline"
                              >
                                {business.internationalPhoneNumber}
                              </a>
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No phone numbers available</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Email Addresses</h3>
                  {business.emails && business.emails.length > 0 ? (
                    <div className="space-y-3">
                      {business.emails.map((email, index) => (
                        <div key={index} className="flex items-start">
                          <Mail className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium">{index === 0 ? "Primary Email" : `Email ${index + 1}`}</p>
                            <a href={`mailto:${email}`} className="text-blue-600 hover:underline break-all">
                              {email}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No email addresses available</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Address Information</h3>
                {business.formattedAddress ? (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Business Address</p>
                      <p className="text-gray-700">{business.formattedAddress}</p>
                      {business.googleMapsUri && (
                        <a
                          href={business.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center mt-1 text-sm"
                        >
                          View on Google Maps
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No address information available</p>
                )}
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Online Presence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {business.websiteUri ? (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a
                          href={business.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center break-all"
                        >
                          {business.websiteUri}
                          <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <Globe className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <p className="text-gray-500">No website available</p>
                      </div>
                    </div>
                  )}

                  {business.linkedIn ? (
                    <div className="flex items-start">
                      <Linkedin className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <a
                          href={business.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center break-all"
                        >
                          {business.linkedIn}
                          <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <Linkedin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <p className="text-gray-500">No LinkedIn profile available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-6">
          {/* Leadership */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership & Key People</CardTitle>
              <CardDescription>Key decision makers and leadership team at {business.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {business.gptInsights?.["leadership/Managers/Administration"] && business.gptInsights["leadership/Managers/Administration"].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {business.gptInsights["leadership/Managers/Administration"].map((person, index) => (
                    <div key={index} className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.role || "Leadership"}</p>
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="text-blue-600 hover:underline text-sm block mt-1"
                          >
                            {person.email}
                          </a>
                        )}
                        {person.phone && (
                          <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline text-sm block mt-1">
                            {person.phone}
                          </a>
                        )}
                        {person.linkedin && (
                          <a
                            href={person.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center mt-1"
                          >
                            LinkedIn
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No leadership information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees */}
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
              <CardDescription>Other team members at {business.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {business.gptInsights?.employees && business.gptInsights.employees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {business.gptInsights.employees.map((person, index) => (
                    <div key={index} className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.role || "Employee"}</p>
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="text-blue-600 hover:underline text-sm block mt-1"
                          >
                            {person.email}
                          </a>
                        )}
                        {person.phone && (
                          <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline text-sm block mt-1">
                            {person.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No employee information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          {business.gptInsights?.socialMedia && business.gptInsights.socialMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Presence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.gptInsights.socialMedia.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        {social.platform.toLowerCase().includes("linkedin") ? (
                          <Linkedin className="h-4 w-4 text-blue-600" />
                        ) : social.platform.toLowerCase().includes("twitter") ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-blue-400"
                          >
                            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                          </svg>
                        ) : (
                          <Globe className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{social.platform}</p>
                        <p className="text-sm text-gray-500 truncate">{social.url}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public Posts */}
          {business.gptInsights?.["publicPosts/JobPosts"] && business.gptInsights["publicPosts/JobPosts"].length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Public Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {business.gptInsights["publicPosts/JobPosts"].map((post, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">{post.date}</p>
                        {post.source && (
                          <a
                            href={post.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                          >
                            Source
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-700">{post.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Website Tab */}
        <TabsContent value="website" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Information</CardTitle>
              {business.websiteUri && (
                <CardDescription>
                  <a
                    href={business.websiteUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {business.websiteUri}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {business.websiteInfo ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <p className="font-medium flex items-center">
                        {business.websiteInfo.websiteStatus === "Online" ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            Online
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                            {business.websiteInfo.websiteStatus || "Unknown"}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Security</p>
                      <p className="font-medium flex items-center">
                        {business.websiteInfo.hasSSL ? (
                          <>
                            <Shield className="h-4 w-4 text-green-500 mr-1" />
                            SSL Secured
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-4 w-4 text-amber-500 mr-1" />
                            Not Secure
                          </>
                        )}
                      </p>
                    </div>

                    {business.websiteInfo.pageSpeed?.performance !== undefined && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-500 mb-1">Performance</p>
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="font-medium">
                              {Math.round(business.websiteInfo.pageSpeed?.performance)}%
                            </p>
                          </div>
                          <Progress
                            value={business.websiteInfo.pageSpeed.performance * 100}
                            className="h-2"
                            indicatorClassName={
                              business.websiteInfo.pageSpeed.performance > 0.8
                                ? "bg-green-500"
                                : business.websiteInfo.pageSpeed.performance > 0.5
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }
                          />
                        </div>
                      </div>
                    )}

                    {business.websiteInfo.pageSpeed?.load_time && (
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-500 mb-1">Load Time</p>
                        <p className="font-medium">
                          {(business.websiteInfo.pageSpeed.load_time / 1000).toFixed(1)} seconds
                        </p>
                      </div>
                    )}
                  </div>

                  {(business.websiteInfo.pageSpeed?.lcp ||
                    business.websiteInfo.pageSpeed?.fcp ||
                    business.websiteInfo.pageSpeed?.tti) && (
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {business.websiteInfo.pageSpeed?.lcp && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-500 mb-1">Largest Contentful Paint</p>
                            <p className="font-medium">{business.websiteInfo.pageSpeed.lcp}</p>
                          </div>
                        )}
                        {business.websiteInfo.pageSpeed?.fcp && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-500 mb-1">First Contentful Paint</p>
                            <p className="font-medium">{business.websiteInfo.pageSpeed.fcp}</p>
                          </div>
                        )}
                        {business.websiteInfo.pageSpeed?.tti && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-500 mb-1">Time to Interactive</p>
                            <p className="font-medium">{business.websiteInfo.pageSpeed.tti}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* {business.websiteInfo.pageSpeed !== undefined && (
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">SEO & Accessibility</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-500 mb-1">SEO Score</p>
                          <div>
                            <div className="flex justify-between mb-1">
                              <p className="font-medium">{Math.round(business.websiteInfo.pageSpeed.seo * 100)}%</p>
                            </div>
                            <Progress
                              value={business.websiteInfo.pageSpeed.seo * 100}
                              className="h-2"
                              indicatorClassName={
                                business.websiteInfo.pageSpeed.seo > 0.8
                                  ? "bg-green-500"
                                  : business.websiteInfo.pageSpeed.seo > 0.5
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }
                            />
                          </div>
                        </div>

                        {business.websiteInfo.pageSpeed?.accessibility !== undefined && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-500 mb-1">Accessibility Score</p>
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="font-medium">
                                  {Math.round(business.websiteInfo.pageSpeed.accessibility * 100)}%
                                </p>
                              </div>
                              <Progress
                                value={business.websiteInfo.pageSpeed.accessibility * 100}
                                className="h-2"
                                indicatorClassName={
                                  business.websiteInfo.pageSpeed.accessibility > 0.8
                                    ? "bg-green-500"
                                    : business.websiteInfo.pageSpeed.accessibility > 0.5
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No website information available</p>
                  {business.websiteUri && (
                    <a
                      href={business.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center justify-center mt-2"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Customer Reviews</CardTitle>
                  <CardDescription>
                    {business.userRatingCount
                      ? `${business.userRatingCount} reviews with an average rating of ${business.rating?.toFixed(1)}`
                      : "No reviews available"}
                  </CardDescription>
                </div>
                {business.rating && (
                  <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-bold">{business.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {business.reviews && business.reviews.length > 0 ? (
                <div className="space-y-6">
                  {business.reviews.map((review, index) => (
                    <div key={index} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            {review.authorAttribution?.photoUri ? (
                              <AvatarImage
                                src={review.authorAttribution.photoUri || "/placeholder.svg"}
                                alt={review.authorAttribution.displayName || "Reviewer"}
                              />
                            ) : (
                              <AvatarFallback>
                                {review.authorAttribution?.displayName
                                  ? getInitials(review.authorAttribution.displayName)
                                  : "??"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {review.authorAttribution?.displayName || "Anonymous Reviewer"}
                            </p>
                            <p className="text-sm text-gray-500">{review.relativePublishTimeDescription}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (review.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">
                        {review.text?.text || review.originalText?.text || "No review text available"}
                      </p>
                      {review.googleMapsUri && (
                        <a
                          href={review.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center mt-2"
                        >
                          View on Google Maps
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No reviews available for this business</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
