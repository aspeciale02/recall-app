import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanDay } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { data: topics } = await supabase
      .from('topics')
      .select('name, mastery_score')
      .eq('course_id', courseId)

    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'No topics found for this course' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const examDate = new Date(course.exam_date)
    examDate.setHours(0, 0, 0, 0)
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExam <= 0) {
      return NextResponse.json({ error: 'Exam date is in the past' }, { status: 400 })
    }

    const topicList = topics.map(t => `${t.name} (mastery: ${t.mastery_score}%)`).join(', ')
    const startDate = today.toISOString().split('T')[0]
    const endDate = course.exam_date

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Create a day-by-day study plan for a student with ${daysUntilExam} days until their ${course.name} exam.

Topics and current mastery: ${topicList}

Rules:
- Cover all topics at least once
- Revisit low-mastery topics more frequently
- Last 2-3 days should be comprehensive review
- Return ONLY valid JSON, no markdown

Format: {"plan": [{"date": "YYYY-MM-DD", "topics": ["Topic1", "Topic2"], "question_count": 5}]}

Start date: ${startDate}
End date: ${endDate}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let planData: { plan: PlanDay[] }
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      planData = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse study plan:', responseText.slice(0, 300))
      // Fallback: generate a simple plan
      const plan: PlanDay[] = []
      const topicNames = topics.map(t => t.name)
      const totalDays = Math.min(daysUntilExam, 30)

      for (let i = 0; i < totalDays; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        const startIdx = (i * Math.ceil(topicNames.length / totalDays)) % topicNames.length
        const endIdx = Math.min(startIdx + Math.ceil(topicNames.length / totalDays), topicNames.length)
        const sliced = topicNames.slice(startIdx, endIdx)
        const dayTopics = sliced.length > 0 ? sliced : [topicNames[i % topicNames.length]]
        plan.push({
          date: d.toISOString().split('T')[0],
          topics: dayTopics,
          question_count: dayTopics.length * 3,
        })
      }
      planData = { plan }
    }

    const admin = createAdminClient()
    await admin.from('study_plans').delete().eq('course_id', courseId)
    await admin.from('study_plans').insert({
      course_id: courseId,
      plan_json: planData.plan,
    })

    return NextResponse.json({ plan: planData.plan })
  } catch (err) {
    console.error('Study plan error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate study plan' },
      { status: 500 }
    )
  }
}
