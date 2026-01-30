import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Skull, Info, Shield } from "lucide-react";

const SUBSTANCES = [
  "Psilocybin", "LSD", "DMT", "Ayahuasca", "MDMA", "Ketamine",
  "Mescaline", "2C-B", "Salvia", "Cannabis", "Alcohol", "Caffeine",
  "SSRIs", "MAOIs", "Benzodiazepines", "Opioids", "Stimulants", "Other"
];

const severityConfig = {
  safe: { icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200", label: "Safe" },
  caution: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Caution" },
  dangerous: { icon: XCircle, color: "bg-orange-100 text-orange-800 border-orange-200", label: "Dangerous" },
  deadly: { icon: Skull, color: "bg-red-100 text-red-800 border-red-200", label: "Deadly" },
};

interface Interaction {
  substance1: string;
  substance2: string;
  severity: keyof typeof severityConfig;
  description: string;
  effects: string;
  recommendations: string;
}

export default function SafetyCheck() {
  const [substance1, setSubstance1] = useState("");
  const [substance2, setSubstance2] = useState("");

  const { data: checkResult } = useQuery<{ interaction: Interaction | null }>({
    queryKey: ["/api/interactions/check", substance1, substance2],
    enabled: !!substance1 && !!substance2,
    queryFn: async () => {
      const res = await fetch(`/api/interactions/check?substance1=${substance1}&substance2=${substance2}`);
      return res.json();
    },
  });

  const { data: allInteractions = [] } = useQuery<Interaction[]>({
    queryKey: ["/api/interactions"],
  });

  const renderSeverityBadge = (severity: keyof typeof severityConfig) => {
    const config = severityConfig[severity];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-8 w-8" />
        Substance Safety Check
      </h1>

      <Tabs defaultValue="check" className="space-y-6">
        <TabsList>
          <TabsTrigger value="check">Check Interaction</TabsTrigger>
          <TabsTrigger value="database">Interaction Database</TabsTrigger>
        </TabsList>

        <TabsContent value="check" className="space-y-6">
          {/* Interaction Checker */}
          <Card>
            <CardHeader>
              <CardTitle>Check Combination</CardTitle>
              <CardDescription>
                Select two substances to check their interaction safety.
                This information is for harm reduction purposes only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Substance</label>
                  <Select value={substance1} onValueChange={setSubstance1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select substance" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSTANCES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Second Substance</label>
                  <Select value={substance2} onValueChange={setSubstance2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select substance" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSTANCES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Result */}
              {substance1 && substance2 && (
                <div className="pt-4">
                  {checkResult?.interaction ? (
                    <Alert
                      variant={checkResult.interaction.severity === "deadly" || checkResult.interaction.severity === "dangerous" ? "destructive" : "default"}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        {renderSeverityBadge(checkResult.interaction.severity)}
                        <AlertTitle className="mb-0">
                          {substance1} + {substance2}
                        </AlertTitle>
                      </div>
                      <AlertDescription className="space-y-3 pt-2">
                        <p>{checkResult.interaction.description}</p>

                        {checkResult.interaction.effects && (
                          <div>
                            <p className="font-medium text-sm">Potential Effects:</p>
                            <p className="text-sm">{checkResult.interaction.effects}</p>
                          </div>
                        )}

                        {checkResult.interaction.recommendations && (
                          <div>
                            <p className="font-medium text-sm">Recommendations:</p>
                            <p className="text-sm">{checkResult.interaction.recommendations}</p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Known Interaction</AlertTitle>
                      <AlertDescription>
                        We don't have specific data about this combination. This doesn't mean it's safe.
                        Always research thoroughly and start with low doses when combining substances.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important Disclaimer</AlertTitle>
            <AlertDescription>
              This tool is for harm reduction education only. It is not medical advice.
              Individual reactions can vary significantly. Always consult healthcare professionals
              and research multiple sources before combining any substances.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Known Interactions</CardTitle>
              <CardDescription>
                Reference database of known substance interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allInteractions.map((interaction, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {interaction.substance1} + {interaction.substance2}
                      </span>
                      {renderSeverityBadge(interaction.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {interaction.description}
                    </p>
                    {interaction.recommendations && (
                      <p className="text-sm">
                        <span className="font-medium">Recommendation: </span>
                        {interaction.recommendations}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
