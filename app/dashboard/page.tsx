import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function getDaysLeft(examDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getReadinessColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch courses with topics for readiness score
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch topics for each course to compute readiness
  const courseTopics: Record<string, number> = {}
  if (courses && courses.length > 0) {
    const { data: topics } = await supabase
      .from('topics')
      .select('course_id, mastery_score')
      .in('course_id', courses.map(c => c.id))

    if (topics) {
      const grouped: Record<string, number[]> = {}
      topics.forEach(t => {
        if (!grouped[t.course_id]) grouped[t.course_id] = []
        grouped[t.course_id].push(t.mastery_score)
      })
      Object.entries(grouped).forEach(([courseId, scores]) => {
        courseTopics[courseId] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      })
    }
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-blue-500">Re</span>call
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <form action={handleSignOut}>
              <button className="text-sm text-gray-500 hover:text-white transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">Your courses and exam countdown.</p>
          </div>
          <Link
            href="/courses/new"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            New Course
          </Link>
        </div>

        {/* Courses */}
        {!courses || courses.length === 0 ? (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-gray-400 mb-6">Add your first course to get started with your AI study plan.</p>
            <Link
              href="/courses/new"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const daysLeft = getDaysLeft(course.exam_date)
              const readiness = courseTopics[course.id] ?? 0
              const isUrgent = daysLeft <= 7
              const isPast = daysLeft < 0

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 hover:border-blue-500/30 transition-all hover:bg-[#141414] group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="font-semibold text-lg leading-tight group-hover:text-blue-400 transition-colors">
                      {course.name}
                    </h2>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ml-2 shrink-0 ${
                      isPast ? 'bg-gray-800 text-gray-400' :
                      isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {isPast ? 'Past' : isUrgent ? `${daysLeft}d left!` : `${daysLeft}d left`}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    Exam: {new Date(course.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Readiness bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Readiness</span>
                      <span className={getReadinessColor(readiness)}>{readiness}%</span>
                    </div>
                    <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          readiness >= 70 ? 'bg-green-500' :
                          readiness >= 40 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${readiness}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
