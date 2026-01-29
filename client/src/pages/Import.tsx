import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Upload, FileJson, FileSpreadsheet, CheckCircle2, 
  AlertCircle, ArrowRight, Heart, Calendar, Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ImportFormat = "daylio" | "apple_health" | "custom_json" | "custom_csv";

interface ParsedData {
  entries: {
    date: string;
    level?: number;
    notes?: string;
    activities?: string[];
  }[];
  format: string;
  errors: string[];
}

export default function Import() {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const text = await file.text();
    const result: ParsedData = {
      entries: [],
      format: selectedFormat || "unknown",
      errors: [],
    };

    try {
      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text);
        
        if (selectedFormat === "daylio" || Array.isArray(json)) {
          const entries = Array.isArray(json) ? json : json.dayEntries || [];
          result.entries = entries.map((entry: any) => ({
            date: entry.datetime || entry.date || entry.full_date || new Date().toISOString(),
            level: entry.mood || entry.level || entry.mood_level || 3,
            notes: entry.note || entry.notes || entry.comment || "",
            activities: entry.activities || entry.tags || [],
          }));
        } else if (json.entries) {
          result.entries = json.entries.map((entry: any) => ({
            date: entry.date || entry.timestamp || new Date().toISOString(),
            level: entry.level || entry.mood || entry.score || 3,
            notes: entry.notes || entry.note || "",
            activities: entry.activities || entry.tags || [],
          }));
        }
      } else if (file.name.endsWith(".csv")) {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        const dateIdx = headers.findIndex(h => h.includes("date") || h.includes("time"));
        const moodIdx = headers.findIndex(h => h.includes("mood") || h.includes("level") || h.includes("score"));
        const notesIdx = headers.findIndex(h => h.includes("note") || h.includes("comment"));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          result.entries.push({
            date: values[dateIdx] || new Date().toISOString(),
            level: parseInt(values[moodIdx]) || 3,
            notes: values[notesIdx] || "",
          });
        }
      }

      if (result.entries.length === 0) {
        result.errors.push("No valid entries found in file");
      }
    } catch (err) {
      result.errors.push("Failed to parse file: " + (err instanceof Error ? err.message : "Unknown error"));
    }

    setParsedData(result);
  };

  const importMutation = useMutation({
    mutationFn: async (data: ParsedData) => {
      const response = await apiRequest("POST", "/api/import/mood", { entries: data.entries });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import successful!",
        description: `Imported ${data.imported} mood entries.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/correlations"] });
      setParsedData(null);
      setFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (!parsedData || parsedData.entries.length === 0) return;
    setImporting(true);
    try {
      await importMutation.mutateAsync(parsedData);
    } finally {
      setImporting(false);
    }
  };

  const formatOptions = [
    { value: "daylio", label: "Daylio", icon: Heart, description: "Import from Daylio mood tracker" },
    { value: "apple_health", label: "Apple Health", icon: Heart, description: "Import mindfulness data" },
    { value: "custom_json", label: "Custom JSON", icon: FileJson, description: "JSON with date, level, notes fields" },
    { value: "custom_csv", label: "Custom CSV", icon: FileSpreadsheet, description: "CSV with date, mood, notes columns" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/5">
            <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="heading-import">
            Import Data
          </h1>
        </div>
        <p className="text-muted-foreground pl-10">
          Bring in your mood and meditation data from other apps
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {formatOptions.map((format) => {
          const Icon = format.icon;
          return (
            <Card
              key={format.value}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedFormat === format.value ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedFormat(format.value as ImportFormat)}
              data-testid={`format-${format.value}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{format.label}</CardTitle>
                    <CardDescription className="text-xs">{format.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {selectedFormat && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload File</CardTitle>
            <CardDescription>
              Select a {selectedFormat === "custom_csv" ? "CSV" : "JSON"} file to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept={selectedFormat === "custom_csv" ? ".csv" : ".json"}
                onChange={handleFileChange}
                className="flex-1"
                data-testid="input-file"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileJson className="h-4 w-4" />
                <span>{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {parsedData && (
        <Card className={parsedData.errors.length > 0 ? "border-destructive/50" : "border-green-500/50"}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {parsedData.errors.length > 0 ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Parsing Issues
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Ready to Import
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.errors.length > 0 ? (
              <ul className="text-sm text-destructive space-y-1">
                {parsedData.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{parsedData.entries.length}</div>
                    <div className="text-xs text-muted-foreground">Entries found</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {parsedData.entries[0]?.date?.split("T")[0] || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">Earliest date</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">
                      {parsedData.entries[parsedData.entries.length - 1]?.date?.split("T")[0] || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">Latest date</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Preview of first entry:</p>
                  <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-auto">
                    {JSON.stringify(parsedData.entries[0], null, 2)}
                  </pre>
                </div>

                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  className="w-full"
                  data-testid="button-import"
                >
                  {importing ? "Importing..." : (
                    <>
                      Import {parsedData.entries.length} Entries
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Supported Formats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Daylio:</strong> Export from Daylio app (Settings → Export → JSON)
          </div>
          <div>
            <strong>Custom JSON:</strong> Array of objects with <code className="bg-muted px-1 rounded">date</code>, <code className="bg-muted px-1 rounded">level</code> (1-5), <code className="bg-muted px-1 rounded">notes</code>
          </div>
          <div>
            <strong>Custom CSV:</strong> Columns for date, mood/level (1-5), notes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
