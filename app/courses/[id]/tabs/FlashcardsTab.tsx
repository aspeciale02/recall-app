'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { Topic, Question } from '@/types/database'

interface Props {
  course: { id: string; name: string; exam_date: string }
  topics: Topic[]
  questions: Question[]
  userId: string
  onTopicUpdate: (topic: Topic) => void
  onQuestionUpdate: (question: Question) => void
}

type Rating = 'easy' | 'hard' | 'skip'

export default function FlashcardsTab({ topics, questions }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<Rating[]>([])
  const [sessionComplete, setSessionComplete] = useState(false)

  // useRef-based shuffle — same pattern as VoiceTestTab
  const shuffledRef = useRef<Question[]>([])
  const prevLengthRef = useRef(0)

  if (questions.length !== prevLengthRef.current) {
    shuffledRef.current = [...questions].sort(() => Math.random() - 0.5)
    prevLengthRef.current = questions.length
  }

  const shuffled = shuffledRef.current

  const topicMap = useMemo(() => {
    const map: Record<string, Topic> = {}
    topics.forEach(t => { map[t.id] = t })
    return map
  }, [topics])

  const handleRate = (rating: Rating) => {
    setResults(prev => [...prev, rating])
    setIsFlipped(false)
    if (currentIdx + 1 >= shuffled.length) {
      setSessionComplete(true)
    } else {
      setCurrentIdx(prev => prev + 1)
    }
  }

  const resetSession = () => {
    shuffledRef.current = [...questions].sort(() => Math.random() - 0.5)
    setCurrentIdx(0)
    setIsFlipped(false)
    setResults([])
    setSessionComplete(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped(true)
      }
      if (isFlipped) {
        if (e.key === '1') handleRate('easy')
        if (e.key === '2') handleRate('hard')
        if (e.key === '3') handleRate('skip')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipped, currentIdx])

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🃏</div>
        <h2 className="text-xl font-semibold mb-2">No flashcards yet</h2>
        <p className="text-gray-400 text-sm">
          Upload materials and process them to generate practice questions.
        </p>
      </div>
    )
  }

  if (sessionComplete) {
    const easy = results.filter(r => r === 'easy').length
    const hard = results.filter(r => r === 'hard').length
    const skip = results.filter(r => r === 'skip').length

    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="text-5xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Session complete</h2>
        <p className="text-gray-400 text-sm mb-8">You reviewed {results.length} cards</p>

        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{easy}</div>
              <div className="text-xs text-gray-500 mt-1">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{hard}</div>
              <div className="text-xs text-gray-500 mt-1">Hard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{skip}</div>
              <div className="text-xs text-gray-500 mt-1">Skipped</div>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-8">
          The hard ones will come back sooner in your practice sessions.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetSession}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Study again
          </button>
          <button
            onClick={resetSession}
            className="px-6 py-2.5 rounded-xl bg-[#111] border border-[#1f1f1f] hover:bg-[#1a1a1a] text-white text-sm font-medium transition-colors"
          >
            Back to course
          </button>
        </div>
      </div>
    )
  }

  const question = shuffled[currentIdx]
  const cardsLeft = shuffled.length - currentIdx
  const progress = currentIdx / shuffled.length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar + counter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{currentIdx + 1} / {shuffled.length}</span>
          <span className="text-sm text-gray-400">{cardsLeft} card{cardsLeft !== 1 ? 's' : ''} left</span>
        </div>
        <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div style={{ perspective: '1000px' }} className="w-full max-w-xl mx-auto">
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.4s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            height: '280px',
          }}
          onClick={() => setIsFlipped(true)}
          className="cursor-pointer"
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col justify-between"
          >
            <span className="text-xs text-blue-400 font-medium">
              {topicMap[question.topic_id]?.name ?? 'Topic'}
            </span>
            <p className="text-white text-lg font-medium text-center">{question.question}</p>
            <p className="text-white/30 text-xs text-center">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}
            className="rounded-2xl bg-white/5 border border-white/10 p-8 flex flex-col justify-between"
          >
            <p className="text-white/60 text-xs">Answer</p>
            <p className="text-white text-base text-center">{question.correct_answer}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); handleRate('hard') }}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
              >
                Hard
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRate('skip') }}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRate('easy') }}
                className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
              >
                Easy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-white/20 text-xs mt-6">
        Space to flip · 1 Easy · 2 Hard · 3 Skip
      </p>
    </div>
  )
}
