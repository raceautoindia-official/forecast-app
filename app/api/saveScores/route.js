// File: app/api/saveScores/route.js
import pool from 'lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  let conn
  try {
    conn = await pool.getConnection()

    // join submissions + per‐question scores
    const [rows] = await conn.query(`
      SELECT 
        s.id              AS submissionId,
        s.created_at      AS createdAt,
        ss.question_id    AS questionId,
        ss.year_index     AS yearIndex,
        ss.score          AS scoreValue,
        ss.skipped        AS skipped
      FROM submissions s
      JOIN submission_scores ss
        ON ss.submission_id = s.id
      ORDER BY s.created_at DESC, ss.question_id, ss.year_index
    `)

    // group them
    const map = new Map()
    for (const r of rows) {
      const {
        submissionId,
        createdAt,
        questionId,
        yearIndex,
        scoreValue,
        skipped
      } = r

      if (!map.has(submissionId)) {
        map.set(submissionId, {
          id:         submissionId,
          createdAt:  createdAt,
          scores:     []
        })
      }
      map.get(submissionId).scores.push({
        questionId,
        yearIndex,
        score:   scoreValue,
        skipped: Boolean(skipped)
      })
    }

    const submissions = Array.from(map.values())

    return NextResponse.json({ submissions })
  } catch (err) {
    console.error('GET /api/saveScores error', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  } finally {
    if (conn) conn.release()
  }
}


export async function POST(request) {
  const { results } = await request.json()
  if (!Array.isArray(results)) {
    return new Response('Invalid payload', { status: 400 })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1) Insert a new submission
    const [subRes] = await conn.query(
      'INSERT INTO submissions () VALUES ()'
    )
    const submissionId = subRes.insertId

    // 2) Build rows for submission_scores
    const rows = []
    for (const r of results) {
      const qId = r.questionId
      if (r.skipped) {
        rows.push([submissionId, qId, null, null, true])
      } else {
        for (let yearIndex = 0; yearIndex < r.scores.length; yearIndex++) {
          rows.push([
            submissionId,
            qId,
            yearIndex,
            r.scores[yearIndex] ?? null,
            false
          ])
        }
      }
    }

    // 3) Bulk insert scores
    if (rows.length > 0) {
      await conn.query(
        `INSERT INTO submission_scores
         (submission_id, question_id, year_index, score, skipped)
         VALUES ?`,
        [rows]
      )
    }

    await conn.commit()
    return new Response(
      JSON.stringify({ success: true, submissionId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await conn.rollback()
    console.error('POST /api/saveScores error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  } finally {
    conn.release()
  }
}


export async function DELETE(request) {
  const { id } = await request.json()
  if (!id) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing submission id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1) Delete all scores for this submission
    await conn.query(
      'DELETE FROM submission_scores WHERE submission_id = ?',
      [id]
    )

    // 2) Delete the submission record
    await conn.query(
      'DELETE FROM submissions WHERE id = ?',
      [id]
    )

    await conn.commit()
    return new Response(
      JSON.stringify({ success: true, deletedId: id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await conn.rollback()
    console.error('DELETE /api/saveScores error', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  } finally {
    conn.release()
  }
}

