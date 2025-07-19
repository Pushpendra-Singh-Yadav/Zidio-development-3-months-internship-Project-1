"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's uploads on component mount
  useEffect(() => {
    const fetchUploads = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/get-user-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch uploads");
        }

        const data = await response.json();
        setUploads(data.uploads || []);
      } catch (err) {
        console.error("Error fetching uploads:", err);
        setError("Failed to load your uploads");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user) {
      fetchUploads();
    } else if (!userLoading && !user) {
      setLoading(false);
    }
  }, [user, userLoading]);

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-chart-line text-6xl text-[#357AFF] mb-4"></i>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Excel Analytics Platform
            </h1>
            <p className="text-gray-600">
              Upload Excel files, analyze data, and generate interactive charts
            </p>
          </div>
          <div className="space-y-4">
            <a
              href="/account/signin"
              className="block w-full bg-[#357AFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors"
            >
              Sign In
            </a>
            <a
              href="/account/signup"
              className="block w-full border-2 border-[#357AFF] text-[#357AFF] py-3 px-6 rounded-lg font-medium hover:bg-[#357AFF] hover:text-white transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <i className="fas fa-chart-line text-2xl text-[#357AFF] mr-3"></i>
              <h1 className="text-xl font-bold text-gray-800">
                Excel Analytics
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              {user.role === "admin" && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
              <a
                href="/account/logout"
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/upload"
                className="flex items-center p-4 bg-[#357AFF] text-white rounded-lg hover:bg-[#2E69DE] transition-colors"
              >
                <i className="fas fa-upload text-xl mr-3"></i>
                <div>
                  <div className="font-medium">Upload Excel File</div>
                  <div className="text-sm opacity-90">
                    Start analyzing your data
                  </div>
                </div>
              </a>
              <a
                href="/charts"
                className="flex items-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <i className="fas fa-chart-bar text-xl mr-3"></i>
                <div>
                  <div className="font-medium">View Charts</div>
                  <div className="text-sm opacity-90">
                    Browse your visualizations
                  </div>
                </div>
              </a>
              <a
                href="/insights"
                className="flex items-center p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <i className="fas fa-brain text-xl mr-3"></i>
                <div>
                  <div className="font-medium">AI Insights</div>
                  <div className="text-sm opacity-90">Get smart analysis</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Uploads
              </h2>
              <a
                href="/upload"
                className="text-[#357AFF] hover:text-[#2E69DE] text-sm font-medium"
              >
                Upload New File
              </a>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {uploads.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-file-excel text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No uploads yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload your first Excel file to get started with data analysis
                </p>
                <a
                  href="/upload"
                  className="inline-flex items-center px-4 py-2 bg-[#357AFF] text-white rounded-lg hover:bg-[#2E69DE] transition-colors"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload Excel File
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {uploads.slice(0, 5).map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-file-excel text-2xl text-green-600 mr-4"></i>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {upload.original_filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Uploaded{" "}
                          {new Date(upload.upload_date).toLocaleDateString()} •
                          {upload.file_size
                            ? ` ${Math.round(upload.file_size / 1024)} KB`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          upload.status === "processed"
                            ? "bg-green-100 text-green-800"
                            : upload.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {upload.status}
                      </span>
                      <a
                        href={`/analyze/${upload.id}`}
                        className="text-[#357AFF] hover:text-[#2E69DE] text-sm font-medium"
                      >
                        Analyze
                      </a>
                    </div>
                  </div>
                ))}

                {uploads.length > 5 && (
                  <div className="text-center pt-4">
                    <a
                      href="/uploads"
                      className="text-[#357AFF] hover:text-[#2E69DE] text-sm font-medium"
                    >
                      View All Uploads ({uploads.length})
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;