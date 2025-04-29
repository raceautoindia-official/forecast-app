// app/api/uploadVolumeData/route.js
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const form = new IncomingForm({
      uploadDir: './public/uploads',
      keepExtensions: true,
      multiples: false,
    });
    fs.mkdirSync('./public/uploads', { recursive: true });

    const nodeReq = Object.assign(Readable.fromWeb(req.body), {
      headers: Object.fromEntries(req.headers),
      method: req.method,
      url: '',
    });

    return await new Promise((resolve, reject) => {
      form.parse(nodeReq, async (err, fields, files) => {
        if (err) {
          console.error('Formidable error:', err);
          return reject(new Response(JSON.stringify({ error: 'File parsing failed' }), { status: 500 }));
        }

        const {
          rowChartId,
          colChartId,
          rowLevelNodes,
          colLevelNodes,
          streamPath
        } = fields;

        const rowIds = (Array.isArray(rowLevelNodes) ? rowLevelNodes[0] : rowLevelNodes).split(',').map(Number);
        const colIds = (Array.isArray(colLevelNodes) ? colLevelNodes[0] : colLevelNodes).split(',').map(Number);
        const uploadedFilePath = path.resolve(files.file[0].filepath);

        try {
          await fs.promises.access(uploadedFilePath, fs.constants.R_OK);
        } catch {
          return resolve(new Response(JSON.stringify({ error: 'Uploaded file is not accessible' }), { status: 500 }));
        }

        const fileBuffer = await fs.promises.readFile(uploadedFilePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        if (!headers || headers.length === 0 || rows.length === 0) {
          return resolve(new Response(JSON.stringify({ error: 'Invalid Excel format' }), { status: 400 }));
        }

        const [rowNodes] = await pool.query(
          `SELECT name FROM format_hierarchy WHERE chart_id = ? AND id IN (?)`,
          [rowChartId, rowIds]
        );
        const [colNodes] = await pool.query(
          `SELECT name FROM format_hierarchy WHERE chart_id = ? AND id IN (?)`,
          [colChartId, colIds]
        );

        const expectedRowNames = rowNodes.map(n => n.name);
        const expectedColNames = colNodes.map(n => n.name);
        const excelRowNames = rows.map(row => row[0]);
        const excelColNames = headers.slice(1);

        const missingRows = expectedRowNames.filter(r => !excelRowNames.includes(r));
        const missingCols = expectedColNames.filter(c => !excelColNames.includes(c));

        if (missingRows.length || missingCols.length) {
          return resolve(new Response(JSON.stringify({
            error: 'Excel format does not match selected format hierarchy.',
            details: {
              missingRowLabels: missingRows,
              missingColumnLabels: missingCols
            }
          }), { status: 400 }));
        }

        const [existingRows] = await pool.query(
          'SELECT id, stream, data FROM volume_data WHERE stream = ? AND format_chart_id = ?',
          [streamPath, rowChartId]
        );

        const newMatrix = {};
        rows.forEach((row) => {
          const rowKey = row[0];
          newMatrix[rowKey] = {};
          headers.slice(1).forEach((colHeader, index) => {
            newMatrix[rowKey][colHeader] = row[index + 1];
          });
        });

        if (existingRows.length > 0) {
          const existing = existingRows[0];
          let existingMatrix = {};

          try {
            existingMatrix = JSON.parse(existing.data);
          } catch {
            console.warn('Failed to parse existing data');
          }

          for (const rowKey in newMatrix) {
            if (!existingMatrix[rowKey]) {
              existingMatrix[rowKey] = {};
            }
            for (const colKey in newMatrix[rowKey]) {
              const newVal = newMatrix[rowKey][colKey];
              const oldVal = existingMatrix[rowKey][colKey];
              if (newVal !== oldVal) {
                existingMatrix[rowKey][colKey] = newVal;
              }
            }
          }

          await pool.query(
            'UPDATE volume_data SET data = ? WHERE id = ?',
            [JSON.stringify(existingMatrix), existing.id]
          );
        } else {
          await pool.query(
            'INSERT INTO volume_data (stream, format_chart_id, data) VALUES (?, ?, ?)',
            [streamPath, rowChartId, JSON.stringify(newMatrix)]
          );
        }

        fs.unlink(uploadedFilePath, () => {});

        return resolve(new Response(JSON.stringify({ message: 'Upload and storage successful' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}



