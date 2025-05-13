import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import Header from "@/components/header"
import LeadsTable from "@/components/leads-table"
import OfflineIndicator from "@/components/offline-indicator"
import { getSearchQueries } from "@/lib/api"

export default async function MyLeads() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  const queries = await getSearchQueries()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">My Leads</h1>

        <div className="flex flex-col md:flex-row gap-6">
          <LeadsTable queries={queries} />
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 B2Bi - Your Intelligence Edge in B2B Marketing
      </footer>
      <OfflineIndicator />
    </div>
  )
}
