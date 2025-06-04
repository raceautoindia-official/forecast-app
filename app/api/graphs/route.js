// app/api/graphs/route.js
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, dataset_ids, forecast_types, chart_type, created_at FROM graphs ORDER BY created_at DESC'
    );
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('GET /api/graphs error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const { name, datasetIds, forecastTypes, chartType } = await req.json();
    if (
      !name ||
      !datasetIds ||
      // !datasetIds.length ||
      // !Array.isArray(forecastTypes) ||
      // !forecastTypes.length ||
      !chartType
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO graphs
         (name, dataset_ids, forecast_types, chart_type)
       VALUES (?, ?, ?, ?)`,
      [ name, JSON.stringify(datasetIds), JSON.stringify(forecastTypes), chartType ]
    );

    return new Response(
      JSON.stringify({
        id: result.insertId,
        name,
        datasetIds,
        forecastTypes,
        chartType,
        createdAt: new Date().toISOString(),
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('POST /api/graphs error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


export async function DELETE(req) {
    try {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing graph id' }), { status: 400 });
      }
      await pool.query('DELETE FROM graphs WHERE id = ?', [id]);
      return new Response(JSON.stringify({ message: 'Graph deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('DELETE /api/graphs error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }