"use server"

import type { Business, BusinessType, SearchQuery } from "@/lib/types"

const API_URL = 'https://b2bi-server.onrender.com/api/b2bi';

export async function searchBusinesses(searchText: string, count?: number) {
  try {
    const response = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchText, count }),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching businesses:", error)
    throw error
  }
}

export async function getProcessingStatus() {
  // In a real app, this would fetch from an API endpoint
  // For demo purposes, we'll return mock data
  return {
    queries: [],
    estimatedTimeRemaining: 0,
  }
}

export async function getSearchQueries(): Promise<SearchQuery[]> {
  try {
    const response = await fetch(`${API_URL}/queries`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Error fetching search queries:", error)
    return []
  }
}

export async function getQueryById(id: string): Promise<SearchQuery | null> {
  try {
    const response = await fetch(`${API_URL}/queries/${id}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching query ${id}:`, error)
    return null
  }
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    const response = await fetch(`${API_URL}/businesses`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.businesses || []
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return []
  }
}

export async function getBusinessById(id: string): Promise<Business | null> {
  try {
    const response = await fetch(`${API_URL}/businesses/${id}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching business ${id}:`, error)
    return null
  }
}

export async function getBusinessesByQuery(queryId: string): Promise<Business[]> {
  try {
    const query = await getQueryById(queryId)

    if (!query || !query.results || query.results.length === 0) {
      return []
    }

    // If the query already has populated results, return them
    if (typeof query.results[0] !== "string") {
      return query.results as unknown as Business[]
    }

    // Otherwise, fetch each business by ID
    const businessPromises = (query.results as string[]).map((id: string) => getBusinessById(id))
    const businesses = await Promise.all(businessPromises)

    return businesses.filter((b): b is Business => b !== null)
  } catch (error) {
    console.error(`Error fetching businesses for query:`, error)
    return []
  }
}


// Business Types APIs
export async function getBusinessTypes(): Promise<BusinessType[]> {
  try {
    const response = await fetch(`${API_URL}/businesstype/admin/businesstypes`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.businessTypes || []
  } catch (error) {
    console.error("Error fetching business types:", error)
    return []
  }
}

export async function getBusinessTypeById(id: string): Promise<BusinessType | null> {
  try {
    const response = await fetch(`${API_URL}/businesstype/admin/businesstypes/${id}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching business type ${id}:`, error)
    return null
  }
}

export async function createBusinessType(data: Partial<BusinessType>) {
  try {
    const response = await fetch(`${API_URL}/businesstype/admin/businesstypes`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return await response.json()
  } catch (error) {
    console.error("Error creating business type:", error)
    throw error
  }
}

export async function updateBusinessType(id: string, data: Partial<BusinessType>) {
  try {
    const response = await fetch(`${API_URL}/businesstype/admin/businesstypes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    console.log(response);
    return await response.json()
  } catch (error) {
    console.error("Error updating business type:", error)
    throw error
  }
}

export async function deleteBusinessType(id: string) {
  try {
    const response = await fetch(`${API_URL}/businesstype/admin/businesstypes/${id}`, {
      method: "DELETE",
    })
    return true
  } catch (error) {
    console.error("Error deleting business type:", error)
    throw error
  }
}