export interface Business {
  _id?: string
  id: string
  name: string
  types?: string[]
  businessStatus?: string
  displayName?: {
    text: string
    languageCode: string
  }
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  reviews?: Review[]
  primaryType?: string
  emails?: string[]
  linkedIn?: string
  gptInsights?: {
    company?: {
      name?: string
      foundingYear?: number
    }
    "leadership/Managers/Administration"?: LeadershipMember[];
    employees?: Person[]
    socialMedia?: SocialMedia[]
    "publicPosts/JobPosts"?: Post[];  
  }
  websiteInfo?: {
    websiteStatus?: string
    hasSSL?: boolean
    pageSpeed?: {
      performance?: number
      lcp?: string
      fcp?: string
      tti?: string
      load_time?: number
    }
  }
  searchText?: string
  createdAt?: string
  updatedAt?: string
  contacts?: Contact[]
}

export interface Review {
  name?: string
  relativePublishTimeDescription?: string
  rating?: number
  text?: {
    text: string
    languageCode: string
  }
  originalText?: {
    text: string
    languageCode: string
  }
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
  publishTime?: string
  flagContentUri?: string
  googleMapsUri?: string
}

export interface Person {
  name: string
  role?: string
  email?: string
  phone?: string
  linkedin?: string
  socialHandles?: string[]
}

interface LeadershipMember {
  name: string;
  role: string;
  linkedin?: string;  // Optional
  email?: string;     // Optional
  phone?: string;     // Optional
}

export interface SocialMedia {
  platform: string
  url: string
}

export interface Post {
  date: string
  content: string
  source?: string
}

export interface Contact {
  name: string
  position?: string
  email?: string
  phone?: string
}

export interface SearchQuery {
  _id?: string
  id?: string
  searchText: string
  createdAt: string
  results?: string[] | Business[]
  status?: "processing" | "completed" | "failed"
  estimatedTimeRemaining?: number
}
