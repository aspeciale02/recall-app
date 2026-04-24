import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getNextReviewAt(score: number): string {
  const now = new Date()
  let daysToAdd = 1
  if (score > 80) daysToAdd = 7
  else if (score >= 50) daysToAdd = 3
  else daysToAdd = 1

  now.setDate(now.getDate() + daysToAdd)
  return now.toISOString()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      questionId,
      question,
      correctAnswer,
      studentAnswer,
      isVoice = false,
      userId,
      includeFollowUp = false,
    } = body

    if (!questionId || !question || !correctAnswer || !studentAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const followUpInstruction = includeFollowUp
      ? '\n- "follow_up": "A probing follow-up question to deepen understanding (1 sentence)"'
      : ''

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Grade this student answer. Be a tough but fair professor.

Question: ${question}
Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}
Answer type: ${isVoice ? 'spoken (grade reasoning quality, not exact wording — partial credit for correct concepts)' : 'written'}

Return ONLY valid JSON, no markdown:
{
  "score": 0-100,
  "feedback": "2-3 sentences of specific feedback focusing on what was right and what was missing",
  "weak_spots": ["concept1", "concept2"]${followUpInstruction}
}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let gradeResult: {
      score: number
      feedback: string
      weak_spots: string[]
      follow_up?: string
    }

    try {
      const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      gradeResult = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse grade result:', responseText.slice(0, 300))
      // Fallback grading
      gradeResult = {
        score: 50,
        feedback: 'Unable to parse AI feedback. Your answer was recorded.',
        weak_spots: [],
      }
    }

    const score = Math.max(0, Math.min(100, gradeResult.score))
    const nextReviewAt = getNextReviewAt(score)

    const admin = createAdminClient()

    // Save answer
    const { error: answerError } = await admin
      .from('answers')
      .insert({
        question_id: questionId,
        user_id: userId || user.id,
        answer_text: studentAnswer,
        is_voice: isVoice,
        score,
        feedback: gradeResult.feedback,
        weak_spots: gradeResult.weak_spots || [],
      })

    if (answerError) {
      console.error('Answer save error:', answerError)
    }

    // Update question stats
    const { data: existingQ } = await admin
      .from('questions')
      .select('times_seen, times_correct, topic_id')
      .eq('id', questionId)
      .single()

    if (existingQ) {
      const { error: qUpdateError } = await admin
        .from('questions')
        .update({
          next_review_at: nextReviewAt,
          times_seen: existingQ.times_seen + 1,
          times_correct: existingQ.times_correct + (score >= 70 ? 1 : 0),
        })
        .eq('id', questionId)

      if (qUpdateError) {
        console.error('Question update error:', qUpdateError)
      }

      // Recalculate topic mastery
      const { data: topicAnswers } = await admin
        .from('answers')
        .select('score, questions!inner(topic_id)')
        .eq('questions.topic_id', existingQ.topic_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (topicAnswers && topicAnswers.length > 0) {
        const avgScore = Math.round(
          topicAnswers.reduce((sum, a) => sum + a.score, 0) / topicAnswers.length
        )

        const { data: updatedTopic, error: topicUpdateError } = await admin
          .from('topics')
          .update({ mastery_score: avgScore })
          .eq('id', existingQ.topic_id)
          .select()
          .single()

        if (topicUpdateError) {
          console.error('Topic mastery update error:', topicUpdateError)
        }

        return NextResponse.json({
          score,
          feedback: gradeResult.feedback,
          weak_spots: gradeResult.weak_spots || [],
          follow_up: gradeResult.follow_up,
          next_review_at: nextReviewAt,
          updated_topic: updatedTopic,
        })
      }
    }

    return NextResponse.json({
      score,
      feedback: gradeResult.feedback,
      weak_spots: gradeResult.weak_spots || [],
      follow_up: gradeResult.follow_up,
      next_review_at: nextReviewAt,
    })
  } catch (err) {
    console.error('Grade error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Grading failed' },
      { status: 500 }
    )
  }
}
