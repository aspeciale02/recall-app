'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewCoursePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [courseName, setCourseName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [courseId, setCourseId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [processStatus, setProcessStatus] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({ user_id: user.id, name: courseName, exam_date: examDate })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setUploading(false)
      return
    }

    setCourseId(data.id)
    setStep(2)
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUploadAndProcess = async () => {
    if (files.length === 0) {
      // Skip upload, go straight to processing with empty content
      await triggerProcessing(courseId, '')
      return
    }

    setUploading(true)
    setError('')

    const supabase = createClient()
    let allContent = ''

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('courseId', courseId)

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await res.json()
        allContent += '\n\n' + data.content
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setUploading(false)
        return
      }
    }

    setUploading(false)
    await triggerProcessing(courseId, allContent)
  }

  const triggerProcessing = async (id: string, content: string) => {
    setProcessing(true)
    setProcessStatus('Extracting topics from your content...')

    try {
      const res = await fetch(`/api/courses/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Processing failed')
      }

      setProcessStatus('Generating study plan...')
      await new Promise(r => setTimeout(r, 500))
      setProcessStatus('Done! Redirecting to your course...')
      await new Promise(r => setTimeout(r, 800))
      router.push(`/courses/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-blue-500">Re</span>call
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-10">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-[#1f1f1f] text-gray-500'
              }`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 ? 'Course details' : 'Upload materials'}
              </span>
              {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-blue-500' : 'bg-[#2f2f2f]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-1">New Course</h1>
            <p className="text-gray-400 text-sm mb-8">What are you studying for?</p>

            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Course name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. ECON 301 — Macroeconomics"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Exam date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  required
                  min={today}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {uploading ? 'Creating...' : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-1">Upload Materials</h1>
            <p className="text-gray-400 text-sm mb-8">
              Add your lecture slides, notes, or textbook chapters. PDF and images supported.
            </p>

            {processing ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                  <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-white font-medium">{processStatus}</p>
                <p className="text-gray-500 text-sm mt-1">Claude is analyzing your content...</p>
              </div>
            ) : (
              <>
                {/* Drop zone */}
                <label className="block border-2 border-dashed border-[#2a2a2a] hover:border-blue-500/40 rounded-xl p-8 text-center cursor-pointer transition-colors mb-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">📎</div>
                  <p className="text-gray-300 font-medium mb-1">Drop files here or click to browse</p>
                  <p className="text-gray-500 text-sm">PDF or images · Multiple files OK</p>
                </label>

                {/* File list */}
                {files.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{file.type.includes('pdf') ? '📄' : '🖼️'}</span>
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-gray-500 hover:text-red-400 transition-colors ml-3 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleUploadAndProcess}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    {uploading ? 'Uploading...' : files.length > 0 ? `Process ${files.length} file${files.length > 1 ? 's' : ''}` : 'Generate Study Plan →'}
                  </button>
                  {files.length === 0 && (
                    <button
                      onClick={() => router.push(`/courses/${courseId}`)}
                      className="px-5 py-3 border border-[#2a2a2a] hover:border-[#444] text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
                    >
                      Skip
                    </button>
                  )}
                </div>
                <p className="text-center text-xs text-gray-600 mt-3">
                  No files? You can add them later from the course page.
                </p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
