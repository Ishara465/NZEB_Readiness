import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

// --- PREDEFINED SCORING MATRIX ---
// Matches the updated weights and levels for all 58 questions sequentially.
const SCORING_MATRIX = [
  // TECHNICAL READINESS (Q1 - Q16)
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q1
  [0.37, 0.75, 1.12, 1.5, 1.87], // Q2
  [0.43, 0.86, 1.28, 1.71, 2.14], // Q3
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q4
  [0.43, 0.86, 1.28, 1.71, 2.14], // Q5
  [0.37, 0.75, 1.12, 1.5, 1.87], // Q6
  [0.43, 0.86, 1.28, 1.71, 2.14], // Q7
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q8
  [0.43, 0.86, 1.28, 1.71, 2.14], // Q9
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q10
  [0.39, 0.78, 1.18, 1.57, 1.96], // Q11
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q12
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q13
  [0.39, 0.78, 1.18, 1.57, 1.96], // Q14
  [0.37, 0.75, 1.12, 1.5, 1.87], // Q15
  [0.41, 0.82, 1.23, 1.64, 2.05], // Q16

  // OPERATIONAL READINESS (Q17 - Q32)
  [0.34, 0.68, 1.01, 1.35, 1.69], // Q17
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q18
  [0.34, 0.68, 1.01, 1.35, 1.69], // Q19
  [0.34, 0.68, 1.01, 1.35, 1.69], // Q20
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q21
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q22
  [0.34, 0.68, 1.01, 1.35, 1.69], // Q23
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q24
  [0.34, 0.68, 1.01, 1.35, 1.69], // Q25
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q26
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q27
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q28
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q29
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q30
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q31
  [0.32, 0.64, 0.97, 1.29, 1.61], // Q32

  // FINANCIAL READINESS (Q33 - Q45)
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q33
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q34
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q35
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q36
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q37
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q38
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q39
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q40
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q41
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q42
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q43
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q44
  [0.37, 0.74, 1.11, 1.48, 1.85], // Q45

  // POLICY & REGULATORY READINESS (Q46 - Q58)
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q46
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q47
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q48
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q49
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q50
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q51
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q52
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q53
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q54
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q55
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q56
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q57
  [0.28, 0.55, 0.83, 1.1, 1.38], // Q58
];

// --- DYNAMIC GAUGE / PIE CHART COMPONENT ---
const ScoreGauge = ({ score }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getReadinessStatus = (s) => {
    if (s === 0)
      return {
        label: "Not Started",
        color: "text-gray-400",
        stroke: "stroke-gray-300",
        bg: "bg-white",
        border: "border-gray-200",
      };
    if (s <= 20)
      return {
        label: "Not Initiated",
        color: "text-red-600",
        stroke: "stroke-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    if (s <= 40)
      return {
        label: "Emerging",
        color: "text-orange-600",
        stroke: "stroke-orange-500",
        bg: "bg-orange-50",
        border: "border-orange-200",
      };
    if (s <= 60)
      return {
        label: "Established",
        color: "text-yellow-600",
        stroke: "stroke-yellow-400",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
      };
    if (s <= 80)
      return {
        label: "Advanced",
        color: "text-blue-600",
        stroke: "stroke-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    return {
      label: "NZEB Ready",
      color: "text-emerald-600",
      stroke: "stroke-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  };

  const status = getReadinessStatus(score);

  return (
    <div
      className={`flex flex-col md:flex-row items-center gap-5 ${status.bg} px-6 py-4 rounded-2xl border ${status.border} shadow-sm transition-colors duration-500`}
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90 drop-shadow-sm"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-gray-200"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${status.stroke} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${status.color}`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <div className="text-center md:text-left">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">
          Overall Status
        </span>
        <div
          className={`text-2xl font-black ${status.color} leading-none mb-1.5`}
        >
          {status.label}
        </div>
        <div className="text-sm font-semibold text-gray-600">
          {score.toFixed(2)} / 100 Total Points
        </div>
      </div>
    </div>
  );
};

function App() {
  const [data, setData] = useState(null);

  // Initialize scores from LocalStorage
  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem("nzeb_assessment_scores");
    return savedScores ? JSON.parse(savedScores) : {};
  });

  const [currentPillarIdx, setCurrentPillarIdx] = useState(0);
  const [isReportView, setIsReportView] = useState(false);

  const reportRef = useRef(null);

  const levelNames = [
    "Level 1: Not Initiated",
    "Level 2: Emerging",
    "Level 3: Established",
    "Level 4: Advanced",
    "Level 5: NZEB Optimized",
  ];

  // Auto-Save data
  useEffect(() => {
    localStorage.setItem("nzeb_assessment_scores", JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    const fetchAndParseCSV = async () => {
      try {
        const response = await fetch("/assessment.csv");
        const reader = await response.text();

        Papa.parse(reader, {
          header: false,
          complete: (results) => {
            const parsedData = processCSV(results.data);
            setData(parsedData);
          },
        });
      } catch (error) {
        console.error("Error loading CSV:", error);
      }
    };
    fetchAndParseCSV();
  }, []);

  const processCSV = (rows) => {
    let pillarsMap = new Map();
    let currentPillarName = "";
    let currentCategoryName = "";
    let questionSequenceIndex = 0; // Tracks consecutive valid questions

    rows.forEach((row, i) => {
      if (i === 0 || row.length < 8) return;

      let pCell = row[0] ? row[0].trim() : "";
      let cCell = row[1] ? row[1].trim() : "";
      let qCell = row[2] ? row[2].trim() : "";

      if (pCell)
        currentPillarName = pCell.replace(/[\=\(]?\s*full marks.*/i, "").trim();
      if (cCell)
        currentCategoryName = cCell
          .replace(/[\=\(]?\s*full marks.*/i, "")
          .trim();

      // If there is no question in this row, skip it
      if (!qCell) return;

      let questionText = qCell.split("marks")[0].trim();

      if (!pillarsMap.has(currentPillarName)) {
        pillarsMap.set(currentPillarName, {
          name: currentPillarName,
          categories: new Map(),
        });
      }

      let pObj = pillarsMap.get(currentPillarName);
      if (!pObj.categories.has(currentCategoryName)) {
        pObj.categories.set(currentCategoryName, {
          name: currentCategoryName,
          questions: [],
        });
      }

      let cObj = pObj.categories.get(currentCategoryName);
      let options = [];

      // Fetch the strict scores based on the sequential question index
      let targetScores = SCORING_MATRIX[questionSequenceIndex] || [
        0, 0, 0, 0, 0,
      ];

      for (let j = 3; j <= 7; j++) {
        let optStr = row[j] ? row[j].trim() : "";
        if (!optStr) continue;

        // Use the strict matrix value rather than regex text scraping
        let score = targetScores[j - 3];

        let cleanText = optStr
          .replace(/\.?\s*\(marks?\s*=\s*[0-9.]+\)/i, "")
          .replace(/^"|"$/g, "")
          .trim();

        options.push({
          level: j - 2,
          text: cleanText,
          score: score,
        });
      }

      cObj.questions.push({
        id: `q_${i}`,
        text: questionText,
        options: options,
      });

      // Increment sequence index so the next question pulls the next set of marks
      questionSequenceIndex++;
    });

    return Array.from(pillarsMap.values()).map((p) => ({
      name: p.name,
      categories: Array.from(p.categories.values()),
    }));
  };

  const handleOptionChange = (qId, score, pillarName, optText, optLevel) => {
    setScores((prev) => ({
      ...prev,
      [qId]: { score, pillarName, text: optText, level: optLevel },
    }));
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all assessment data? This will reset all your progress.",
      )
    ) {
      setScores({});
      localStorage.removeItem("nzeb_assessment_scores");
      setCurrentPillarIdx(0);
    }
  };

  const calculatePillarMax = (pillar) => {
    let max = 0;
    pillar.categories.forEach((c) => {
      c.questions.forEach((q) => {
        const highestOpt = Math.max(...q.options.map((o) => o.score));
        max += highestOpt;
      });
    });
    return Number(max.toFixed(2));
  };

  const calculatePillarScore = (pillar) => {
    let total = 0;
    Object.values(scores).forEach((s) => {
      if (s.pillarName === pillar.name) total += s.score;
    });
    const maxScore = calculatePillarMax(pillar);
    if (total > maxScore) total = maxScore;
    return total;
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(scores).forEach((s) => (total += s.score));
    if (total > 100) total = 100;
    return total;
  };

  // --- NEW FEATURE: EXPORT AS WEB PAGE (.HTML) ---
  const downloadWebPage = () => {
    const element = reportRef.current;
    if (!element) return;

    // Capture the current report's exact DOM structure
    const reportHtml = element.innerHTML;

    // Wrap it in a complete, self-contained HTML document
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Final Readiness Report - Passive Design</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; padding: 2rem; }
            .report-container { max-width: 64rem; margin: 0 auto; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 3rem; }
            @media print {
                body { background-color: white; padding: 0; }
                .report-container { box-shadow: none; padding: 0; }
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body class="text-gray-800 antialiased" style="WebkitPrintColorAdjust: exact; print-color-adjust: exact;">
        
        <div class="max-w-5xl mx-auto mb-6 text-right no-print">
           <button onclick="window.print()" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
             🖨️ Print / Save as PDF
           </button>
        </div>

        <div class="report-container">
            ${reportHtml}
        </div>

    </body>
    </html>
    `;

    // Trigger file download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NZEB_Readiness_Report_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading Assessment Data...
      </div>
    );
  }

  const currentTotalScore = calculateTotal();

  // ---------------- REPORT VIEW ----------------
  if (isReportView) {
    return (
      <main
        className="min-h-screen bg-gray-50 text-gray-800 font-sans py-12 px-4 md:px-8 print:bg-white print:py-0"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8 print:hidden">
            <button
              onClick={() => setIsReportView(false)}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold shadow-sm transition-all"
            >
              ← Back to Assessment
            </button>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold shadow-md transition-all flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>

              <button
                onClick={downloadWebPage}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Save as Web Page
              </button>
            </div>
          </div>

          <div
            ref={reportRef}
            className="bg-white shadow-xl rounded-2xl border border-gray-200 p-8 md:p-12 print:shadow-none print:border-none print:p-0"
          >
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Final Readiness Report
                </h1>
                <p className="text-gray-500 font-medium">
                  Passive Design & NZEB Assessment
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Generated on: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <ScoreGauge score={currentTotalScore} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Pillar Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {data.map((p, idx) => {
                const pScore = calculatePillarScore(p);
                const pMax = calculatePillarMax(p);
                const pPercent = pMax === 0 ? 0 : (pScore / pMax) * 100;
                return (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-5"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-800">{p.name}</span>
                      <span className="font-black text-blue-600">
                        {pScore.toFixed(2)} / {pMax.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${pPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-3">
              Detailed Assessment Selection
            </h2>
            <div className="space-y-10">
              {data.map((pillar, pIdx) => (
                <div key={pIdx} className="print:break-inside-avoid">
                  <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-wide bg-gray-100 py-2 px-4 rounded-lg">
                    {pillar.name}
                  </h3>
                  {pillar.categories.map((cat, cIdx) => (
                    <div
                      key={cIdx}
                      className="mb-6 pl-4 border-l-2 border-gray-200"
                    >
                      <h4 className="text-lg font-bold text-gray-700 mb-4">
                        {cat.name}
                      </h4>
                      <div className="space-y-4">
                        {cat.questions.map((q) => {
                          const selection = scores[q.id];
                          return (
                            <div
                              key={q.id}
                              className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
                            >
                              <p className="font-bold text-gray-900 mb-2">
                                {q.text}
                              </p>
                              {selection ? (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                  <div>
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                                      {levelNames[selection.level - 1]}
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">
                                      {selection.text}
                                    </p>
                                  </div>
                                  <div className="whitespace-nowrap flex items-center justify-center bg-white border border-blue-200 text-blue-700 font-bold px-3 py-1.5 rounded-md shadow-sm">
                                    {selection.score} pts
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                  <p className="text-sm font-bold text-red-500">
                                    Not Evaluated / Unanswered
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------------- MAIN ASSESSMENT VIEW ----------------
  const currentPillar = data[currentPillarIdx];

  return (
    <main
      className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col items-center py-12 px-4"
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <section
        id="center"
        className="flex flex-col items-center w-full max-w-3xl text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900">
          NZEB Readiness Assessment
        </h1>
      </section>

      <div className="w-full max-w-7xl">
        <header className="bg-white shadow-sm rounded-2xl p-6 mb-8 border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left flex-1">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              NZEB Readiness Score
            </h2>
            <p className="text-gray-500 font-medium mb-5">
              Select parameters to calculate readiness level automatically.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <button
                onClick={() => setIsReportView(true)}
                className="px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generate Report
              </button>

              <button
                onClick={handleClearData}
                className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear Data
              </button>
            </div>
          </div>

          <ScoreGauge score={currentTotalScore} />
        </header>

        <div className="flex space-x-3 mb-8 overflow-x-auto pb-2">
          {data.map((p, idx) => {
            // const maxScore = calculatePillarMax(p);
            return (
              <button
                key={idx}
                onClick={() => setCurrentPillarIdx(idx)}
                className={`px-5 py-3.5 whitespace-nowrap rounded-xl font-bold transition-all duration-200 ${currentPillarIdx === idx ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
              >
                {p.name}
                {/* <span
                  className={`ml-3 px-2.5 py-1 rounded-md text-sm ${currentPillarIdx === idx ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700 font-semibold"}`}
                >
                  {calculatePillarScore(p).toFixed(2)} / {maxScore.toFixed(2)}
                </span> */}
              </button>
            );
          })}
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 md:p-8">
          <div className="mb-8 pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h3 className="text-3xl font-bold text-gray-800">
              {currentPillar.name}
            </h3>
            {/* <span className="text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              Pillar Score:{" "}
              <span className="text-blue-600">
                {calculatePillarScore(currentPillar).toFixed(2)}
              </span>{" "}
              / {calculatePillarMax(currentPillar).toFixed(2)}
            </span> */}
          </div>

          {currentPillar.categories.map((category, catIdx) => (
            <div key={catIdx} className="mb-12 last:mb-0">
              <h4 className="text-xl font-bold text-gray-800 bg-gray-50 px-5 py-4 rounded-xl mb-6 border border-gray-200 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                {category.name}
              </h4>

              <div className="space-y-6">
                {category.questions.map((q) => (
                  <div
                    key={q.id}
                    className="border border-gray-200 p-6 rounded-2xl hover:border-blue-200 transition-colors bg-white"
                  >
                    <p className="text-lg font-bold text-gray-900 mb-5">
                      {q.text}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = scores[q.id]?.score === opt.score;
                        return (
                          <label
                            key={optIdx}
                            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col transition-all duration-200 ${isSelected ? "bg-blue-50 border-blue-500 shadow-sm transform scale-[1.02]" : "bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50/20"}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              className="sr-only"
                              checked={isSelected}
                              onChange={() =>
                                handleOptionChange(
                                  q.id,
                                  opt.score,
                                  currentPillar.name,
                                  opt.text,
                                  opt.level,
                                )
                              }
                            />
                            <div className="flex flex-col mb-3 space-y-2">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-blue-700" : "text-gray-500"}`}
                              >
                                {levelNames[opt.level - 1]}
                              </span>
                            </div>
                            <span
                              className={`text-sm leading-relaxed flex-grow font-medium ${isSelected ? "text-blue-900" : "text-gray-600"}`}
                            >
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default App;
