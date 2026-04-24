'use client'

import { useState } from 'react'
import { Course, Topic, StudyPlan, PlanDay } from '@/types/database'

interface Props {
  course: Course
  topics: Topic[]
  studyPlan: StudyPlan | null
  questionsCount: number
}

export default function StudyPlanTab({ course, topics, studyPlan, questionsCount }: Props) {
  const [generating, setGenerating] = useState(false)
  const [localPlan, setLocalPlan] = useState<PlanDay[]>(
    studyPlan ? (studyPlan.plan_json as PlanDay[]) : []
  )
  const [error, setError] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const generatePlan = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/courses/${course.id}/study-plan`, {
        method: 'POST',
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to generate plan')
      }
      const data = await res.json()
      setLocalPlan(data.plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating plan')
    } finally {
      setGenerating(false)
    }
  }

  const isPast = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d < today
  }

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }

  if (topics.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-xl font-semibold mb-2">No content yet</h2>
        <p className="text-gray-400 mb-6">
          Upload your lecture materials first so Claude can build your study plan.
        </p>
        <p className="text-sm text-gray-600">
          Go to your course and upload PDFs or images to get started.
        </p>
      </div>
    )
  }

  if (localPlan.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🗓️</div>
        <h2 className="text-xl font-semibold mb-2">No study plan yet</h2>
        <p className="text-gray-400 mb-6">
          Generate your personalized day-by-day study plan based on your {topics.length} topics.
        </p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 mb-4 max-w-md mx-auto">
            {error}
          </div>
        )}
        <button
          onClick={generatePlan}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Building your plan...
            </span>
          ) : 'Generate Study Plan'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Your Study Plan</h2>
          <p className="text-gray-400 text-sm mt-1">{localPlan.length} days · {topics.length} topics · {questionsCount} questions</p>
        </div>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Regenerating...' : '↻ Regenerate'}
        </button>
      </div>

      <div className="space-y-3">
        {localPlan.map((day, idx) => {
          const past = isPast(day.date)
          const todayDay = isToday(day.date)
          const dateObj = new Date(day.date)
          const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

          return (
            <div
              key={idx}
              className={`border rounded-xl p-5 transition-all ${
                todayDay
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : past
                  ? 'border-[#1a1a1a] bg-[#0d0d0d] opacity-60'
                  : 'border-[#1f1f1f] bg-[#111]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {todayDay && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Today
                    </span>
                  )}
                  <span className={`text-sm font-medium ${past ? 'text-gray-500' : todayDay ? 'text-blue-400' : 'text-gray-300'}`}>
                    {dateStr}
                  </span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {day.question_count} questions
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {day.topics.map((topic, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      past ? 'bg-[#1f1f1f] text-gray-500' :
                      todayDay ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' :
                      'bg-[#1f1f1f] text-gray-300'
                    }`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
