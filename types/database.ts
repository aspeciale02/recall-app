export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          user_id: string
          name: string
          exam_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          exam_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          exam_date?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          course_id: string
          name: string
          content: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          content: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          content?: string
          type?: string
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          course_id: string
          name: string
          description: string | null
          mastery_score: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          name: string
          description?: string | null
          mastery_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          name?: string
          description?: string | null
          mastery_score?: number
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          topic_id: string
          question: string
          correct_answer: string
          difficulty: string
          next_review_at: string
          times_seen: number
          times_correct: number
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          question: string
          correct_answer: string
          difficulty?: string
          next_review_at?: string
          times_seen?: number
          times_correct?: number
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          question?: string
          correct_answer?: string
          difficulty?: string
          next_review_at?: string
          times_seen?: number
          times_correct?: number
          created_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          question_id: string
          user_id: string
          answer_text: string
          is_voice: boolean
          score: number
          feedback: string
          weak_spots: string[]
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          answer_text: string
          is_voice?: boolean
          score: number
          feedback: string
          weak_spots?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          answer_text?: string
          is_voice?: boolean
          score?: number
          feedback?: string
          weak_spots?: string[]
          created_at?: string
        }
      }
      study_plans: {
        Row: {
          id: string
          course_id: string
          plan_json: PlanDay[]
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          plan_json: PlanDay[]
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          plan_json?: PlanDay[]
          created_at?: string
        }
      }
    }
  }
}

export type PlanDay = {
  date: string
  topics: string[]
  question_count: number
}

export type Course = Database['public']['Tables']['courses']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Topic = Database['public']['Tables']['topics']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']
export type StudyPlan = Database['public']['Tables']['study_plans']['Row']
