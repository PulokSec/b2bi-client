import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getBusinessById } from "@/lib/api"
import Header from "@/components/header"
import BusinessDetails from "@/components/business-details"
import OfflineIndicator from "@/components/offline-indicator"

// Add dynamic directive to prevent static rendering
export const dynamic = "force-dynamic"

export default async function BusinessPage({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  const business = await getBusinessById(params.id)

  if (!business) {
    redirect("/my-leads")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 p-6">
        <BusinessDetails business={business} />
      </div>
      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 B2Bi - Your Intelligence Edge in B2B Marketing
      </footer>
      <OfflineIndicator />
    </div>
  )
}
