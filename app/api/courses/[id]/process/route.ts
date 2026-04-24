import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface QuestionData {
  question: string
  correct_answer: string
  difficulty: string
}

interface TopicData {
  name: string
  description: string
  questions: QuestionData[]
}

interface ExtractedData {
  topics: TopicData[]
}

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

    const body = await req.json()
    let content = body.content || ''

    // If no content passed, try fetching from documents in DB
    if (!content.trim()) {
      const { data: docs } = await supabase
        .from('documents')
        .select('content')
        .eq('course_id', courseId)

      if (docs && docs.length > 0) {
        content = docs.map(d => d.content).join('\n\n')
      }
    }

    if (!content.trim()) {
      // Generate generic topics for the course name
      content = `Course: ${course.name}. Generate relevant topics and practice questions for a university-level course with this title.`
    }

    // Cap content length
    const truncatedContent = content.slice(0, 30000)

    // Call Claude to extract topics and generate questions
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are analyzing university lecture content. Extract the 5-10 most important topics from this material. For each topic generate 5 practice questions with correct answers at varying difficulty levels. Return ONLY valid JSON with no markdown code blocks.

Format: {"topics": [{"name": "Topic Name", "description": "Brief description", "questions": [{"question": "...", "correct_answer": "...", "difficulty": "easy|medium|hard"}]}]}

Content: ${truncatedContent}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let extracted: ExtractedData
    try {
      // Strip any markdown code blocks if present
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      extracted = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Claude response:', responseText.slice(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    if (!extracted.topics || extracted.topics.length === 0) {
      return NextResponse.json({ error: 'No topics extracted' }, { status: 500 })
    }

    const admin = createAdminClient()

    // Save topics and questions
    for (const topicData of extracted.topics) {
      const { data: topic, error: topicError } = await admin
        .from('topics')
        .insert({
          course_id: courseId,
          name: topicData.name,
          description: topicData.description,
          mastery_score: 0,
        })
        .select()
        .single()

      if (topicError) {
        console.error('Topic insert error:', topicError)
        continue
      }

      // Insert questions
      const questionsToInsert = (topicData.questions || []).map(q => ({
        topic_id: topic.id,
        question: q.question,
        correct_answer: q.correct_answer,
        difficulty: q.difficulty || 'medium',
        next_review_at: new Date().toISOString(),
        times_seen: 0,
        times_correct: 0,
      }))

      if (questionsToInsert.length > 0) {
        const { error: qError } = await admin
          .from('questions')
          .insert(questionsToInsert)

        if (qError) {
          console.error('Questions insert error:', qError)
        }
      }
    }

    // Generate study plan
    const examDate = new Date(course.exam_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const topicNames = extracted.topics.map(t => t.name)

    const planDays = []
    if (daysUntilExam > 0) {
      const totalDays = Math.min(daysUntilExam, 30)
      const topicsPerDay = Math.ceil(topicNames.length / totalDays)

      for (let i = 0; i < totalDays; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        const startIdx = (i * Math.ceil(topicNames.length / totalDays)) % topicNames.length
        const endIdx = Math.min(startIdx + Math.ceil(topicNames.length / totalDays), topicNames.length)
        const sliced = topicNames.slice(startIdx, endIdx)
        const dayTopics = sliced.length > 0 ? sliced : [topicNames[i % topicNames.length]]

        planDays.push({
          date: date.toISOString().split('T')[0],
          topics: dayTopics,
          question_count: dayTopics.length * 3,
        })
      }
    }

    if (planDays.length > 0) {
      // Remove existing plan
      await admin.from('study_plans').delete().eq('course_id', courseId)

      await admin.from('study_plans').insert({
        course_id: courseId,
        plan_json: planDays,
      })
    }

    return NextResponse.json({
      success: true,
      topicsCreated: extracted.topics.length,
      questionsCreated: extracted.topics.reduce((sum, t) => sum + (t.questions?.length ?? 0), 0),
      planDays: planDays.length,
    })
  } catch (err) {
    console.error('Process error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
