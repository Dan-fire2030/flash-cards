export interface Category {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface Flashcard {
  id: string
  front_text: string
  back_text: string
  category_id: string
  correct_count: number
  incorrect_count: number
  created_at: string
  updated_at: string
  category?: Category
}

export interface CreateFlashcardData {
  front_text: string
  back_text: string
  category_id: string
}

export interface CreateCategoryData {
  name: string
  parent_id?: string | null
}

export interface FlashcardStats {
  total_attempts: number
  correct_rate: number
}

export interface StudySession {
  id: string
  date: string
  cards_studied: number
  correct_answers: number
  incorrect_answers: number
  study_time_minutes: number
  created_at: string
  updated_at: string
}

export interface StudyRecord {
  id: string
  session_id: string
  flashcard_id: string
  is_correct: boolean
  answered_at: string
}

export interface DailyStats {
  date: string
  cardsStudied: number
  correctAnswers: number
  incorrectAnswers: number
  accuracy: number
}