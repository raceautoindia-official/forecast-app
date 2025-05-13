// File: app/api/scoreSettings/route.js
import { NextResponse } from 'next/server';
import db from '../../../lib/db';

const SCORE_SETTINGS_KEY = 'scoreSettings';
const TABLE_DDL = `
CREATE TABLE IF NOT EXISTS score_settings (
  \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
  \`value\` JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export async function GET(request) {
  try {
    // Ensure table exists
    await db.query(TABLE_DDL);
    const [rows] = await db.query(
      'SELECT `value` FROM score_settings WHERE `key` = ?',
      [SCORE_SETTINGS_KEY]
    );
    if (!rows.length) {
      return NextResponse.json({ yearNames: [], scoreLabels: [] });
    }
    const rawValue = rows[0].value;
    let data;
    if (typeof rawValue === 'object') {
      data = rawValue;
    } else if (
      typeof rawValue === 'string' &&
      (rawValue.trim().startsWith('{') || rawValue.trim().startsWith('['))
    ) {
      data = JSON.parse(rawValue);
    } else {
      console.warn('Unexpected rawValue for scoreSettings:', rawValue);
      data = { yearNames: [], scoreLabels: [] };
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching scoreSettings:', error);
    return NextResponse.json({ yearNames: [], scoreLabels: [] });
  }
}

export async function POST(request) {
  try {
    await db.query(TABLE_DDL);
    const { yearNames, scoreLabels } = await request.json();
    const value = JSON.stringify({ yearNames, scoreLabels });
    await db.query(
      'INSERT INTO score_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      [SCORE_SETTINGS_KEY, value, value]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving scoreSettings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

