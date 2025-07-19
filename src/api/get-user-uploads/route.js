async function handler({ userId }) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required", status: 401 };
  }

  if (!userId) {
    return { error: "User ID is required", status: 400 };
  }

  if (session.user.id !== userId && session.user.role !== "admin") {
    return { error: "Access denied", status: 403 };
  }

  try {
    const uploads = await sql`
      SELECT 
        id,
        filename,
        original_filename,
        file_url,
        file_size,
        upload_date,
        status
      FROM uploads 
      WHERE user_id = ${userId}
      ORDER BY upload_date DESC
    `;

    return {
      uploads: uploads,
      count: uploads.length,
      status: 200,
    };
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Failed to retrieve uploads", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}