"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [uploadData, setUploadData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedXAxis, setSelectedXAxis] = useState("");
  const [selectedYAxis, setSelectedYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [chartData, setChartData] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [streamingInsights, setStreamingInsights] = useState("");

  const handleFinishInsights = useCallback((message) => {
    setAiInsights(message);
    setStreamingInsights("");
    setGeneratingInsights(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingInsights,
    onFinish: handleFinishInsights,
  });

  // Get upload ID from URL
  const uploadId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : null;

  // Fetch upload data and parse Excel file
  useEffect(() => {
    const fetchUploadData = async () => {
      if (!user || !uploadId) return;

      try {
        // Get upload record
        const response = await fetch("/api/get-user-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch upload data");
        }

        const data = await response.json();
        const upload = data.uploads.find((u) => u.id.toString() === uploadId);

        if (!upload) {
          throw new Error("Upload not found");
        }

        setUploadData(upload);

        // Parse Excel data (simulated - in real app would use actual Excel parsing)
        const mockData = [
          {
            Month: "January",
            Sales: 12000,
            Expenses: 8000,
            Profit: 4000,
            Region: "North",
          },
          {
            Month: "February",
            Sales: 15000,
            Expenses: 9000,
            Profit: 6000,
            Region: "North",
          },
          {
            Month: "March",
            Sales: 18000,
            Expenses: 10000,
            Profit: 8000,
            Region: "South",
          },
          {
            Month: "April",
            Sales: 14000,
            Expenses: 8500,
            Profit: 5500,
            Region: "East",
          },
          {
            Month: "May",
            Sales: 16000,
            Expenses: 9500,
            Profit: 6500,
            Region: "West",
          },
          {
            Month: "June",
            Sales: 20000,
            Expenses: 11000,
            Profit: 9000,
            Region: "North",
          },
          {
            Month: "July",
            Sales: 22000,
            Expenses: 12000,
            Profit: 10000,
            Region: "South",
          },
          {
            Month: "August",
            Sales: 19000,
            Expenses: 10500,
            Profit: 8500,
            Region: "East",
          },
          {
            Month: "September",
            Sales: 17000,
            Expenses: 9800,
            Profit: 7200,
            Region: "West",
          },
          {
            Month: "October",
            Sales: 21000,
            Expenses: 11500,
            Profit: 9500,
            Region: "North",
          },
        ];

        setParsedData(mockData);
      } catch (err) {
        console.error("Error fetching upload data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user) {
      fetchUploadData();
    } else if (!userLoading && !user) {
      setLoading(false);
    }
  }, [user, userLoading, uploadId]);

  // Generate chart data
  const generateChart = useCallback(() => {
    if (!parsedData || !selectedXAxis || !selectedYAxis) return;

    const labels = parsedData.map((row) => row[selectedXAxis]);
    const values = parsedData.map((row) => row[selectedYAxis]);

    let chartConfig = {
      labels: labels,
      datasets: [
        {
          label: selectedYAxis,
          data: values,
          backgroundColor:
            chartType === "pie"
              ? [
                  "#357AFF",
                  "#22C55E",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#06B6D4",
                  "#F97316",
                  "#84CC16",
                  "#EC4899",
                  "#6366F1",
                ]
              : "#357AFF",
          borderColor: "#2E69DE",
          borderWidth: 2,
          fill: chartType === "line" ? false : true,
        },
      ],
    };

    if (chartType === "scatter") {
      chartConfig = {
        datasets: [
          {
            label: `${selectedXAxis} vs ${selectedYAxis}`,
            data: parsedData.map((row) => ({
              x: row[selectedXAxis],
              y: row[selectedYAxis],
            })),
            backgroundColor: "#357AFF",
            borderColor: "#2E69DE",
          },
        ],
      };
    }

    setChartData(chartConfig);
    setShowChart(true);
  }, [parsedData, selectedXAxis, selectedYAxis, chartType]);

  // Generate AI insights
  const generateAIInsights = useCallback(async () => {
    if (!parsedData) return;

    setGeneratingInsights(true);
    setAiInsights("");
    setStreamingInsights("");

    try {
      const dataPreview = parsedData
        .slice(0, 5)
        .map((row) =>
          Object.entries(row)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        )
        .join("\n");

      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Analyze this Excel data and provide insights. Here's a preview of the data:\n\n${dataPreview}\n\nPlease provide:\n1. Key trends and patterns\n2. Notable observations\n3. Recommendations for further analysis\n4. Potential business insights\n\nKeep the analysis concise but comprehensive.`,
            },
          ],
          stream: true,
        }),
      });

      handleStreamResponse(response);
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate AI insights");
      setGeneratingInsights(false);
    }
  }, [parsedData, handleStreamResponse]);

  // Download chart as image
  const downloadChart = useCallback(() => {
    const canvas = document.getElementById("analysisChart");
    if (canvas) {
      const link = document.createElement("a");
      link.download = `chart-${selectedXAxis}-vs-${selectedYAxis}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }, [selectedXAxis, selectedYAxis]);

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
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
            <i className="fas fa-chart-bar text-6xl text-[#357AFF] mb-4"></i>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Data Analysis
            </h1>
            <p className="text-gray-600">Sign in to analyze your Excel data</p>
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

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/dashboard" className="flex items-center">
                  <i className="fas fa-chart-line text-2xl text-[#357AFF] mr-3"></i>
                  <h1 className="text-xl font-bold text-gray-800">
                    Excel Analytics
                  </h1>
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle mr-3"></i>
              <div>
                <h3 className="font-medium">Error Loading Data</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="/dashboard"
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const columns = parsedData ? Object.keys(parsedData[0]) : [];
  const numericColumns = columns.filter(
    (col) => parsedData && typeof parsedData[0][col] === "number"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="flex items-center">
                <i className="fas fa-chart-line text-2xl text-[#357AFF] mr-3"></i>
                <h1 className="text-xl font-bold text-gray-800">
                  Excel Analytics
                </h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
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
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/dashboard" className="hover:text-[#357AFF]">
              Dashboard
            </a>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-gray-800">Analyze Data</span>
          </div>
        </nav>

        {/* File Info */}
        {uploadData && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-file-excel text-3xl text-green-600 mr-4"></i>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {uploadData.original_filename}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Uploaded{" "}
                    {new Date(uploadData.upload_date).toLocaleDateString()} •
                    {uploadData.file_size
                      ? ` ${Math.round(uploadData.file_size / 1024)} KB`
                      : ""}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  uploadData.status === "processed"
                    ? "bg-green-100 text-green-800"
                    : uploadData.status === "processing"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {uploadData.status}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Data Preview
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {parsedData
                    ? `${parsedData.length} rows, ${columns.length} columns`
                    : "Loading..."}
                </p>
              </div>

              <div className="p-6">
                {parsedData ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {columns.map((col) => (
                            <th
                              key={col}
                              className="text-left py-3 px-4 font-medium text-gray-700"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 10).map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            {columns.map((col) => (
                              <td key={col} className="py-3 px-4 text-gray-600">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Showing 10 of {parsedData.length} rows
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#357AFF] mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Chart Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#357AFF] focus:border-transparent"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis
                  </label>
                  <select
                    value={selectedXAxis}
                    onChange={(e) => setSelectedXAxis(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#357AFF] focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y-Axis
                  </label>
                  <select
                    value={selectedYAxis}
                    onChange={(e) => setSelectedYAxis(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#357AFF] focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {numericColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateChart}
                  disabled={!selectedXAxis || !selectedYAxis}
                  className="w-full bg-[#357AFF] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chart-bar mr-2"></i>
                  Generate Chart
                </button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                AI Insights
              </h3>

              <button
                onClick={generateAIInsights}
                disabled={generatingInsights || !parsedData}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                <i className="fas fa-brain mr-2"></i>
                {generatingInsights ? "Generating..." : "Generate AI Insights"}
              </button>

              {(aiInsights || streamingInsights) && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {aiInsights || streamingInsights}
                  {generatingInsights && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Display */}
        {showChart && chartData && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedXAxis} vs {selectedYAxis} ({chartType} chart)
              </h3>
              <button
                onClick={downloadChart}
                className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-download mr-2"></i>
                Download Chart
              </button>
            </div>

            <div className="relative h-96">
              <canvas id="analysisChart" className="w-full h-full"></canvas>
            </div>
          </div>
        )}
      </div>

      {/* Chart.js Integration */}
      {showChart && chartData && (
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      )}

      {showChart && chartData && (
        <script>{`
          const ctx = document.getElementById('analysisChart');
          if (ctx && window.Chart) {
            new Chart(ctx, {
              type: '${chartType}',
              data: ${JSON.stringify(chartData)},
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: ${chartType === "pie" ? "true" : "false"}
                  }
                },
                scales: ${
                  chartType === "pie"
                    ? "{}"
                    : `{
                  y: {
                    beginAtZero: true
                  }
                }`
                }
              }
            });
          }
        `}</script>
      )}
    </div>
  );
}

export default MainComponent;