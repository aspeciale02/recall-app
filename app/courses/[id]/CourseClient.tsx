'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Course, Topic, Question, StudyPlan, Answer, PlanDay } from '@/types/database'
import StudyPlanTab from './tabs/StudyPlanTab'
import PracticeTab from './tabs/PracticeTab'
import VoiceTestTab from './tabs/VoiceTestTab'
import ProgressTab from './tabs/ProgressTab'
import FlashcardsTab from './tabs/FlashcardsTab'

type Tab = 'plan' | 'practice' | 'voice' | 'flashcards' | 'progress'

interface Props {
  course: Course
  topics: Topic[]
  questions: Question[]
  studyPlan: StudyPlan | null
  answers: (Answer & { questions?: { topic_id: string } | null })[]
  userId: string
}

function getDaysLeft(examDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getReadiness(topics: Topic[]): number {
  if (topics.length === 0) return 0
  return Math.round(topics.reduce((sum, t) => sum + t.mastery_score, 0) / topics.length)
}

export default function CourseClient({ course, topics, questions, studyPlan, answers, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics)
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions)

  const daysLeft = getDaysLeft(course.exam_date)
  const readiness = getReadiness(localTopics)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'plan', label: 'Study Plan', icon: '🗓️' },
    { key: 'practice', label: 'Practice', icon: '✍️' },
    { key: 'voice', label: 'Voice Test', icon: '🎙️' },
    { key: 'flashcards', label: 'Flashcards', icon: '🃏' },
    { key: 'progress', label: 'Progress', icon: '📈' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-blue-500">Re</span>call
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Course header */}
      <div className="border-b border-[#1f1f1f] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{course.name}</h1>
              <p className="text-gray-400 text-sm mt-1">
                Exam: {new Date(course.exam_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Days left */}
              <div className={`text-center px-4 py-2 rounded-xl ${
                daysLeft <= 0 ? 'bg-gray-800' :
                daysLeft <= 7 ? 'bg-red-500/10 border border-red-500/20' :
                'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <div className={`text-2xl font-bold ${
                  daysLeft <= 0 ? 'text-gray-400' :
                  daysLeft <= 7 ? 'text-red-400' :
                  'text-blue-400'
                }`}>{daysLeft <= 0 ? '–' : daysLeft}</div>
                <div className="text-xs text-gray-500">days left</div>
              </div>
              {/* Readiness */}
              <div className="text-center px-4 py-2 rounded-xl bg-[#111] border border-[#1f1f1f]">
                <div className={`text-2xl font-bold ${
                  readiness >= 70 ? 'text-green-400' :
                  readiness >= 40 ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>{readiness}%</div>
                <div className="text-xs text-gray-500">ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1f1f1f] px-6">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'plan' && (
          <StudyPlanTab
            course={course}
            topics={localTopics}
            studyPlan={studyPlan}
            questionsCount={localQuestions.length}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeTab
            course={course}
            topics={localTopics}
            questions={localQuestions}
            userId={userId}
            onTopicUpdate={(updatedTopic) => {
              setLocalTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t))
            }}
            onQuestionUpdate={(updatedQuestion) => {
              setLocalQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q))
            }}
          />
        )}
        {activeTab === 'voice' && (
          <VoiceTestTab
            course={course}
            topics={localTopics}
            questions={localQuestions}
            userId={userId}
            onTopicUpdate={(updatedTopic) => {
              setLocalTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t))
            }}
            onQuestionUpdate={(updatedQuestion) => {
              setLocalQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q))
            }}
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab
            course={course}
            topics={localTopics}
            questions={localQuestions}
            userId={userId}
            onTopicUpdate={(updatedTopic) => {
              setLocalTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t))
            }}
            onQuestionUpdate={(updatedQuestion) => {
              setLocalQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q))
            }}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressTab
            course={course}
            topics={localTopics}
            questions={localQuestions}
            answers={answers}
            readiness={readiness}
          />
        )}
      </main>
    </div>
  )
}
