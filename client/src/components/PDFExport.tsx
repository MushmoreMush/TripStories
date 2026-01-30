import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: number;
  substance: string;
  dosage?: string;
  route?: string;
  date?: string;
  createdAt: string;
  setMindset?: string;
  setting?: string;
  experience?: string;
  insights?: string;
  overallMood?: number;
  integrationNotes?: string;
}

interface PDFExportProps {
  report: Report;
  analysis?: {
    sentimentScore: number;
    themes: string[];
    insights: string[];
    integrationSuggestions: string[];
  };
  className?: string;
}

export function PDFExport({ report, analysis, className }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMoodLabel = (mood: number) => {
    if (mood <= 2) return "Challenging";
    if (mood <= 4) return "Neutral";
    if (mood <= 6) return "Positive";
    if (mood <= 8) return "Very Positive";
    return "Transformative";
  };

  const exportToPDF = async () => {
    setIsExporting(true);

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({
          title: "Export failed",
          description: "Please allow pop-ups to export PDF.",
          variant: "destructive",
        });
        return;
      }

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Trip Report - ${report.substance} - ${formatDate(report.date || report.createdAt)}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Georgia', serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              color: #6366f1;
              margin-bottom: 10px;
            }
            .header .date {
              font-size: 14px;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h2 {
              font-size: 16px;
              color: #6366f1;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .section p {
              font-size: 14px;
              margin-bottom: 8px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .detail-item {
              padding: 10px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .detail-item .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .detail-item .value {
              font-size: 16px;
              font-weight: 600;
              color: #333;
            }
            .narrative {
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.8;
            }
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .tag {
              display: inline-block;
              padding: 4px 12px;
              background: #e0e7ff;
              color: #4f46e5;
              border-radius: 20px;
              font-size: 12px;
            }
            .insights-list {
              list-style: none;
              padding-left: 0;
            }
            .insights-list li {
              padding: 8px 0;
              padding-left: 20px;
              position: relative;
              font-size: 14px;
            }
            .insights-list li::before {
              content: "→";
              position: absolute;
              left: 0;
              color: #6366f1;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Integration Journal Entry</h1>
            <div class="date">${formatDate(report.date || report.createdAt)}</div>
          </div>

          <div class="details-grid">
            <div class="detail-item">
              <div class="label">Substance</div>
              <div class="value">${report.substance}</div>
            </div>
            ${report.dosage ? `
              <div class="detail-item">
                <div class="label">Dosage</div>
                <div class="value">${report.dosage}${report.route ? ` (${report.route})` : ""}</div>
              </div>
            ` : ""}
            ${report.overallMood ? `
              <div class="detail-item">
                <div class="label">Overall Experience</div>
                <div class="value">${getMoodLabel(report.overallMood)} (${report.overallMood}/10)</div>
              </div>
            ` : ""}
            ${analysis ? `
              <div class="detail-item">
                <div class="label">Sentiment Analysis</div>
                <div class="value">${Math.round(analysis.sentimentScore * 100)}% Positive</div>
              </div>
            ` : ""}
          </div>

          ${report.setMindset ? `
            <div class="section">
              <h2>Set & Mindset</h2>
              <p class="narrative">${report.setMindset}</p>
            </div>
          ` : ""}

          ${report.setting ? `
            <div class="section">
              <h2>Setting</h2>
              <p class="narrative">${report.setting}</p>
            </div>
          ` : ""}

          ${report.experience ? `
            <div class="section">
              <h2>Experience</h2>
              <p class="narrative">${report.experience}</p>
            </div>
          ` : ""}

          ${report.insights ? `
            <div class="section">
              <h2>Personal Insights</h2>
              <p class="narrative">${report.insights}</p>
            </div>
          ` : ""}

          ${report.integrationNotes ? `
            <div class="section">
              <h2>Integration Notes</h2>
              <p class="narrative">${report.integrationNotes}</p>
            </div>
          ` : ""}

          ${analysis?.themes && analysis.themes.length > 0 ? `
            <div class="section">
              <h2>Key Themes</h2>
              <div class="tags">
                ${analysis.themes.map(theme => `<span class="tag">${theme}</span>`).join("")}
              </div>
            </div>
          ` : ""}

          ${analysis?.integrationSuggestions && analysis.integrationSuggestions.length > 0 ? `
            <div class="section">
              <h2>Integration Suggestions</h2>
              <ul class="insights-list">
                ${analysis.integrationSuggestions.map(s => `<li>${s}</li>`).join("")}
              </ul>
            </div>
          ` : ""}

          <div class="footer">
            <p>Generated from Trip Reporter - Personal Integration Journal</p>
            <p>This document is confidential and for personal use only.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast({
        title: "PDF Export Ready",
        description: "Your PDF is being generated. Use the print dialog to save as PDF.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={exportToPDF}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  );
}
