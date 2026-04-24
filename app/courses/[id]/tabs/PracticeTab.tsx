'use client'

import { useState, useMemo } from 'react'
import { Topic, Question } from '@/types/database'

interface Props {
  course: { id: string; name: string; exam_date: string }
  topics: Topic[]
  questions: Question[]
  userId: string
  onTopicUpdate: (topic: Topic) => void
  onQuestionUpdate: (question: Question) => void
}

interface GradeResult {
  score: number
  feedback: string
  weak_spots: string[]
}

export default function PracticeTab({ course, topics, questions, userId, onTopicUpdate, onQuestionUpdate }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')
  const [sessionScore, setSessionScore] = useState<number[]>([])

  // Questions due for review, sorted by next_review_at
  const dueQuestions = useMemo(() => {
    const now = new Date()
    return [...questions].sort((a, b) =>
      new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()
    )
  }, [questions])

  const currentQuestion = dueQuestions[currentIdx]

  const topicMap = useMemo(() => {
    const map: Record<string, Topic> = {}
    topics.forEach(t => { map[t.id] = t })
    return map
  }, [topics])

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return
    setGrading(true)
    setError('')

    try {
      const res = await fetch('/api/answers/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: currentQuestion.correct_answer,
          studentAnswer: answer,
          isVoice: false,
          userId,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Grading failed')
      }

      const data = await res.json()
      setResult(data)
      setSessionScore(prev => [...prev, data.score])

      // Update question next_review_at
      onQuestionUpdate({
        ...currentQuestion,
        times_seen: currentQuestion.times_seen + 1,
        times_correct: currentQuestion.times_correct + (data.score >= 70 ? 1 : 0),
        next_review_at: data.next_review_at,
      })

      // Update topic mastery if available
      if (data.updated_topic) {
        onTopicUpdate(data.updated_topic)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error grading answer')
    } finally {
      setGrading(false)
    }
  }

  const nextQuestion = () => {
    setResult(null)
    setAnswer('')
    setError('')
    setCurrentIdx(prev => (prev + 1) % dueQuestions.length)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 border-green-500/20'
    if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  const avgSession = sessionScore.length > 0
    ? Math.round(sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length)
    : null

  if (dueQuestions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">No questions yet</h2>
        <p className="text-gray-400 text-sm">
          Upload materials and process them to generate practice questions.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Session stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-400">
          Question {currentIdx + 1} of {dueQuestions.length}
        </div>
        {avgSession !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Session avg:</span>
            <span className={`font-semibold ${getScoreColor(avgSession)}`}>{avgSession}%</span>
          </div>
        )}
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 mb-4">
          {/* Topic badge */}
          <div className="mb-4">
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
              {topicMap[currentQuestion.topic_id]?.name ?? 'Unknown topic'}
            </span>
            <span className="ml-2 text-xs text-gray-600 capitalize">{currentQuestion.difficulty}</span>
          </div>

          <h2 className="text-lg font-medium leading-relaxed mb-6">{currentQuestion.question}</h2>

          {!result ? (
            <>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.metaKey) submitAnswer()
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">⌘ Enter to submit</span>
                <button
                  onClick={submitAnswer}
                  disabled={grading || !answer.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {grading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Grading...
                    </span>
                  ) : 'Submit Answer'}
                </button>
              </div>
            </>
          ) : (
            <div className={`border rounded-xl p-5 ${getScoreBg(result.score)}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Feedback</span>
                <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}/100
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">{result.feedback}</p>
              {result.weak_spots && result.weak_spots.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Areas to review:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.weak_spots.map((spot, i) => (
                      <span key={i} className="text-xs bg-[#1f1f1f] text-gray-300 px-2 py-0.5 rounded-full">
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct answer reveal */}
              {result.score < 70 && (
                <details className="mt-4">
                  <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                    Show correct answer
                  </summary>
                  <p className="mt-2 text-sm text-gray-300 bg-[#1a1a1a] rounded-lg p-3">
                    {currentQuestion.correct_answer}
                  </p>
                </details>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {result && (
        <button
          onClick={nextQuestion}
          className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#1f1f1f] text-white py-3 rounded-xl font-medium transition-colors"
        >
          Next Question →
        </button>
      )}
    </div>
  )
}
