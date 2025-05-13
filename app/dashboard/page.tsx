import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import Header from "@/components/header"
import SearchForm from "@/components/search-form"
import ProcessingStatus from "@/components/processing-status"
import OfflineIndicator from "@/components/offline-indicator"

export default async function Dashboard() {
  const session = await getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Generate Fresh B2B Leads</h1>
          <p className="text-center mb-8">Enter a keyword to discover new business opportunities</p>

          <SearchForm />

          {/* <div className="mt-12">
            <ProcessingStatus />
          </div> */}
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500">
        © 2025 B2Bi - Your Intelligence Edge in B2B Marketing
      </footer>
      <OfflineIndicator />
    </div>
  )
}
