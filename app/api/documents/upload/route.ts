import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as pdfParseModule from 'pdf-parse'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = (pdfParseModule as any).default ?? pdfParseModule

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const courseId = formData.get('courseId') as string | null

    if (!file || !courseId) {
      return NextResponse.json({ error: 'Missing file or courseId' }, { status: 400 })
    }

    // Verify course ownership
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    let content = ''
    const fileType = file.type

    if (fileType === 'application/pdf') {
      // Extract text from PDF
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr)
        content = ''
      }

      if (!content || content.trim().length < 50) {
        return NextResponse.json(
          { error: 'Could not extract text from this PDF. Make sure it is not a scanned image PDF. Try a different file.' },
          { status: 400 }
        )
      }
    } else if (fileType.startsWith('image/')) {
      // For images, we store a placeholder — in production you'd use Claude's vision API
      content = `[Image content from: ${file.name}] - This appears to be lecture slide imagery. Topics and content may be extracted manually.`
    } else {
      // Try to read as text
      content = await file.text()
    }

    if (!content.trim()) {
      content = `[File: ${file.name}] - Content could not be extracted.`
    }

    // Save to DB
    const admin = createAdminClient()
    const { data: doc, error: docError } = await admin
      .from('documents')
      .insert({
        course_id: courseId,
        name: file.name,
        content: content.slice(0, 50000), // cap at 50k chars
        type: fileType.includes('pdf') ? 'pdf' : fileType.startsWith('image/') ? 'image' : 'text',
      })
      .select()
      .single()

    if (docError) {
      console.error('DB error:', docError)
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      type: doc.type,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
