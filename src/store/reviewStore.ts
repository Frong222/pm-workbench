import { create } from 'zustand'
import { db } from '@/db'
import type { Review } from '@/types'

interface ReviewStore {
  reviews: Review[]
  loading: boolean
  loadReviews: () => Promise<void>
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>
  updateReview: (id: string, data: Partial<Review>) => Promise<void>
  deleteReview: (id: string) => Promise<void>
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: [],
  loading: false,
  loadReviews: async () => {
    set({ loading: true })
    const reviews = await db.reviews.orderBy('periodStart').reverse().toArray()
    set({ reviews, loading: false })
  },
  addReview: async (review) => {
    const id = crypto.randomUUID()
    await db.reviews.add({ ...review, id, createdAt: new Date().toISOString() })
    get().loadReviews()
  },
  updateReview: async (id, data) => {
    await db.reviews.update(id, data)
    get().loadReviews()
  },
  deleteReview: async (id) => {
    await db.reviews.delete(id)
    get().loadReviews()
  },
}))