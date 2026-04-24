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

interface GradeResult {
  score: number
  feedback: string
  weak_spots: string[]
  follow_up?: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

export default function VoiceTestTab({ course, topics, questions, userId, onTopicUpdate, onQuestionUpdate }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [sessionScores, setSessionScores] = useState<number[]>([])
  const [error, setError] = useState('')
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null)
  const [fallbackText, setFallbackText] = useState('')
  const [useFallback, setUseFallback] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setVoiceSupported(supported)
  }, [])

  const shuffledRef = useRef<typeof questions>([])
  const prevLengthRef = useRef(0)

  if (questions.length !== prevLengthRef.current) {
    shuffledRef.current = [...questions].sort(() => Math.random() - 0.5)
    prevLengthRef.current = questions.length
  }

  const shuffledQuestions = shuffledRef.current

  const currentQuestion = shuffledQuestions[currentIdx]

  const topicMap = useMemo(() => {
    const map: Record<string, Topic> = {}
    topics.forEach(t => { map[t.id] = t })
    return map
  }, [topics])

  const startRecording = () => {
    if (!voiceSupported) return
    setTranscript('')
    setResult(null)
    setError('')

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRec()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const t = Array.from(event.results)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('')
      setTranscript(t)
    }

    recognition.onerror = (event: { error: string }) => {
      if (event.error !== 'aborted') {
        setError(`Microphone error: ${event.error}. Try the text fallback below.`)
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
    recognitionRef.current = recognition
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  const gradeAnswer = async (answerText: string, isVoice: boolean) => {
    if (!answerText.trim() || !currentQuestion) return
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
          studentAnswer: answerText,
          isVoice,
          userId,
          includeFollowUp: true,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Grading failed')
      }

      const data = await res.json()
      setResult(data)
      setSessionScores(prev => [...prev, data.score])

      onQuestionUpdate({
        ...currentQuestion,
        times_seen: currentQuestion.times_seen + 1,
        times_correct: currentQuestion.times_correct + (data.score >= 70 ? 1 : 0),
        next_review_at: data.next_review_at,
      })

      if (data.updated_topic) {
        onTopicUpdate(data.updated_topic)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grading failed')
    } finally {
      setGrading(false)
    }
  }

  const nextQuestion = () => {
    setResult(null)
    setTranscript('')
    setFallbackText('')
    setError('')
    setCurrentIdx(prev => (prev + 1) % shuffledQuestions.length)
  }

  const avgScore = sessionScores.length > 0
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎙️</div>
        <h2 className="text-xl font-semibold mb-2">No questions yet</h2>
        <p className="text-gray-400 text-sm">Upload materials to generate questions for voice testing.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Session header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold">Voice Test</h2>
          <p className="text-gray-400 text-sm">Speak your answer — AI grades your reasoning.</p>
        </div>
        {avgScore !== null && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</div>
            <div className="text-xs text-gray-500">session avg ({sessionScores.length} answered)</div>
          </div>
        )}
      </div>

      {/* Question */}
      {currentQuestion && (
        <>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
                {topicMap[currentQuestion.topic_id]?.name ?? 'Topic'}
              </span>
              <span className="text-xs text-gray-600 capitalize">{currentQuestion.difficulty}</span>
            </div>
            <h2 className="text-lg font-medium leading-relaxed">{currentQuestion.question}</h2>
          </div>

          {/* Microphone + transcript */}
          {!result && (
            <div className="text-center">
              {voiceSupported !== false && !useFallback ? (
                <>
                  {/* Big mic button */}
                  <div className="relative inline-flex mb-6">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={grading}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-400 scale-110'
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                    >
                      {isRecording ? '⏹' : '🎙️'}
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50" />
                      )}
                    </button>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    {isRecording ? 'Recording... click to stop' : 'Click to start speaking'}
                  </p>

                  {/* Live transcript */}
                  {(transcript || isRecording) && (
                    <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 text-left mb-4 min-h-[80px]">
                      <p className="text-xs text-gray-500 mb-2">Transcript:</p>
                      <p className="text-sm text-gray-200 leading-relaxed">
                        {transcript || <span className="text-gray-600 italic">Listening...</span>}
                      </p>
                    </div>
                  )}

                  {/* Submit after recording stops */}
                  {transcript && !isRecording && (
                    <button
                      onClick={() => gradeAnswer(transcript, true)}
                      disabled={grading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-colors mb-4"
                    >
                      {grading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Grading your answer...
                        </span>
                      ) : 'Submit Answer'}
                    </button>
                  )}

                  <p className="text-xs text-gray-600">
                    Voice not working?{' '}
                    <button onClick={() => setUseFallback(true)} className="text-blue-400 hover:text-blue-300">
                      Type your answer
                    </button>
                  </p>
                </>
              ) : (
                // Text fallback
                <div className="text-left">
                  {voiceSupported === false && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-400 mb-4">
                      Voice input not supported in this browser. Use text instead.
                    </div>
                  )}
                  <textarea
                    value={fallbackText}
                    onChange={e => setFallbackText(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm mb-3"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => gradeAnswer(fallbackText, false)}
                      disabled={grading || !fallbackText.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      {grading ? 'Grading...' : 'Submit Answer'}
                    </button>
                    {voiceSupported && (
                      <button
                        onClick={() => setUseFallback(false)}
                        className="px-4 py-3 border border-[#2a2a2a] hover:border-[#444] text-gray-400 rounded-lg text-sm transition-colors"
                      >
                        Use voice
                      </button>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div>
              <div className={`border rounded-2xl p-6 mb-4 ${
                result.score >= 70 ? 'border-green-500/20 bg-green-500/5' :
                result.score >= 40 ? 'border-yellow-500/20 bg-yellow-500/5' :
                'border-red-500/20 bg-red-500/5'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-lg">Result</span>
                  <span className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}/100
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed mb-4">{result.feedback}</p>

                {result.weak_spots && result.weak_spots.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Weak spots:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.weak_spots.map((spot, i) => (
                        <span key={i} className="text-xs bg-[#1f1f1f] text-gray-300 px-2.5 py-1 rounded-full">
                          {spot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.follow_up && (
                  <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                    <p className="text-xs text-gray-500 mb-1">Follow-up question:</p>
                    <p className="text-sm text-blue-300 italic">{result.follow_up}</p>
                  </div>
                )}
              </div>

              <button
                onClick={nextQuestion}
                className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#1f1f1f] text-white py-3 rounded-xl font-medium transition-colors"
              >
                Next Question →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
