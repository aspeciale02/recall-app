'use client'

import { useMemo } from 'react'
import { Course, Topic, Question, Answer } from '@/types/database'

interface Props {
  course: Course
  topics: Topic[]
  questions: Question[]
  answers: (Answer & { questions?: { topic_id: string } | null })[]
  readiness: number
}

export default function ProgressTab({ course, topics, questions, answers, readiness }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const answersThisWeek = useMemo(() =>
    answers.filter(a => new Date(a.created_at) >= weekAgo),
    [answers] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Streak: consecutive days with at least 1 answer
  const streak = useMemo(() => {
    if (answers.length === 0) return 0
    const days = new Set(answers.map(a => new Date(a.created_at).toDateString()))
    let count = 0
    const d = new Date()
    while (days.has(d.toDateString())) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [answers])

  const weakTopics = topics.filter(t => t.mastery_score < 50)
  const strongTopics = topics.filter(t => t.mastery_score >= 70)

  // Pattern detection: topics where user has answered 5+ questions with low avg score
  const topicPatterns = useMemo(() => {
    const byTopic: Record<string, number[]> = {}
    answers.forEach(a => {
      const topicId = a.questions?.topic_id
      if (!topicId) return
      if (!byTopic[topicId]) byTopic[topicId] = []
      byTopic[topicId].push(a.score)
    })

    return Object.entries(byTopic)
      .filter(([, scores]) => scores.length >= 5 && (scores.reduce((a, b) => a + b, 0) / scores.length) < 60)
      .map(([topicId, scores]) => ({
        topicId,
        topicName: topics.find(t => t.id === topicId)?.name ?? 'Unknown',
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      }))
  }, [answers, topics])

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Exam Ready'
    if (score >= 60) return 'Almost There'
    if (score >= 40) return 'Getting There'
    if (score >= 20) return 'Early Stage'
    return 'Just Starting'
  }

  const getReadinessColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Readiness hero */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8 text-center">
        <p className="text-sm text-gray-500 mb-2">Exam Readiness</p>
        <div className={`text-6xl font-bold mb-2 ${getReadinessColor(readiness)}`}>
          {readiness}%
        </div>
        <p className="text-gray-400 font-medium">{getReadinessLabel(readiness)}</p>

        {/* Bar */}
        <div className="mt-6 h-3 bg-[#1f1f1f] rounded-full overflow-hidden max-w-md mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              readiness >= 70 ? 'bg-green-500' :
              readiness >= 40 ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${readiness}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Answers this week', value: answersThisWeek.length },
          { label: 'Day streak', value: `${streak} 🔥` },
          { label: 'Topics mastered', value: `${strongTopics.length}/${topics.length}` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Topic mastery bars */}
      {topics.length > 0 && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Topic Mastery</h3>
          <div className="space-y-4">
            {[...topics].sort((a, b) => b.mastery_score - a.mastery_score).map(topic => (
              <div key={topic.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-300">{topic.name}</span>
                  <span className={`font-medium ${getReadinessColor(topic.mastery_score)}`}>
                    {topic.mastery_score}%
                  </span>
                </div>
                <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      topic.mastery_score >= 70 ? 'bg-green-500' :
                      topic.mastery_score >= 40 ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${topic.mastery_score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak spots */}
      {weakTopics.length > 0 && (
        <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6">
          <h3 className="font-semibold mb-1 text-red-400">Weak Spots</h3>
          <p className="text-sm text-gray-400 mb-4">Topics below 50% mastery — focus here.</p>
          <div className="space-y-2">
            {weakTopics.map(topic => (
              <div key={topic.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-2.5">
                <span className="text-sm">{topic.name}</span>
                <span className="text-sm font-medium text-red-400">{topic.mastery_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern detection */}
      {topicPatterns.length > 0 && (
        <div className="bg-[#111] border border-yellow-500/20 rounded-2xl p-6">
          <h3 className="font-semibold mb-1 text-yellow-400">Consistent Struggles</h3>
          <p className="text-sm text-gray-400 mb-4">Topics where you&apos;ve answered 5+ questions with low scores.</p>
          <div className="space-y-3">
            {topicPatterns.map(pattern => (
              <div key={pattern.topicId} className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pattern.topicName}</span>
                  <span className="text-sm text-yellow-400">{pattern.avgScore}% avg ({pattern.count} answers)</span>
                </div>
                <p className="text-sm text-gray-400">
                  You consistently struggle with this topic. Focus extra time here and use voice testing to build confidence.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topics.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <div className="text-4xl mb-3">📈</div>
          <p>Upload materials and answer questions to see your progress here.</p>
        </div>
      )}
    </div>
  )
}
