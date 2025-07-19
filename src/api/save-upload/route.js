async function handler({
  userId,
  filename,
  originalFilename,
  fileUrl,
  fileSize,
  status,
}) {
  const session = getSession();

  if (!session || !session.user) {
    return { error: "Authentication required", status: 401 };
  }

  if (!userId || !filename || !originalFilename || !fileUrl) {
    return { error: "Missing required fields", status: 400 };
  }

  if (session.user.id !== userId && session.user.role !== "admin") {
    return { error: "Access denied", status: 403 };
  }

  try {
    const result = await sql`
      INSERT INTO uploads (
        user_id,
        filename,
        original_filename,
        file_url,
        file_size,
        status
      ) VALUES (
        ${userId},
        ${filename},
        ${originalFilename},
        ${fileUrl},
        ${fileSize || null},
        ${status || "uploaded"}
      )
      RETURNING id
    `;

    return {
      uploadId: result[0].id,
      status: 201,
      message: "Upload record saved successfully",
    };
  } catch (error) {
    console.error("Database error:", error);
    return { error: "Failed to save upload record", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}