import { getBusinessTypes } from "@/lib/api"
import BusinessTypeManagement from "@/components/business-type-management"
import Header from "@/components/header"

export const dynamic = "force-dynamic"

export default async function BusinessTypesPage() {
  const businessTypes = await getBusinessTypes()

  // Ensure subcategories is always an array of Subcategory objects
  const normalizedBusinessTypes = businessTypes.map((bt: any) => ({
    ...bt,
    subcategories: Array.isArray(bt.subcategories)
      ? bt.subcategories.map((sub: any) =>
          typeof sub === "string" ? { name: sub } : sub
        )
      : [],
  }))

  return (
    <div className="">
      <Header />
      <div className="p-8">
      <div className="flex justify-between items-center my-8">
        <div>
          <h1 className="text-3xl font-bold">Business Type Management</h1>
          <p className="text-gray-500">Manage business types, subcategories, and AI prompts</p>
        </div>
      </div>

      <BusinessTypeManagement initialBusinessTypes={normalizedBusinessTypes} />
    </div>
    </div>
  )
}
