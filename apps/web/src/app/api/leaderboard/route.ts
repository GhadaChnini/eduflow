import sql from '@/app/api/utils/sql';

export async function GET() {
  const rows = await sql`
    SELECT id, name, image, points, role
    FROM "user"
    ORDER BY points DESC
    LIMIT 50
  `;

  return Response.json({ leaderboard: rows });
}
