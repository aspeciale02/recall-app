import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseClient from './CourseClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!course) redirect('/dashboard')

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('course_id', id)
    .order('created_at')

  const topicIds = topics?.map(t => t.id) ?? []

  const { data: questions } = topicIds.length > 0 ? await supabase
    .from('questions')
    .select('*')
    .in('topic_id', topicIds)
    .order('next_review_at', { ascending: true }) : { data: [] }

  const { data: studyPlan } = await supabase
    .from('study_plans')
    .select('*')
    .eq('course_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: answers } = await supabase
    .from('answers')
    .select('*, questions(topic_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <CourseClient
      course={course}
      topics={topics ?? []}
      questions={questions ?? []}
      studyPlan={studyPlan}
      answers={answers ?? []}
      userId={user.id}
    />
  )
}
