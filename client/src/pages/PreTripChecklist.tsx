import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Plus, Trash2, CheckCircle2, AlertTriangle, Shield, Heart, Home, Brain } from "lucide-react";

interface ChecklistItem {
  id: number;
  category: string;
  item: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
}

interface ChecklistProgress {
  itemId: number;
  completed: boolean;
  completedAt?: string;
}

const categoryConfig: Record<string, { icon: any; color: string; description: string }> = {
  environment: {
    icon: Home,
    color: "bg-green-100 text-green-800",
    description: "Ensure your physical space is safe and comfortable",
  },
  mindset: {
    icon: Brain,
    color: "bg-purple-100 text-purple-800",
    description: "Check your mental and emotional readiness",
  },
  safety: {
    icon: Shield,
    color: "bg-blue-100 text-blue-800",
    description: "Safety preparations and harm reduction",
  },
  support: {
    icon: Heart,
    color: "bg-pink-100 text-pink-800",
    description: "Support system and communication",
  },
};

export default function PreTripChecklist() {
  const queryClient = useQueryClient();
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("environment");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: checklistItems = [] } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklists"],
  });

  const { data: savedProgress = [] } = useQuery<ChecklistProgress[]>({
    queryKey: ["/api/checklists/progress"],
  });

  // Initialize checked items from saved progress
  useState(() => {
    const saved = new Set(savedProgress.filter((p) => p.completed).map((p) => p.itemId));
    setCheckedItems(saved);
  });

  const addItem = useMutation({
    mutationFn: async (data: { item: string; category: string }) => {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      setNewItemText("");
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/checklists/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
    },
  });

  const saveProgress = useMutation({
    mutationFn: async (items: number[]) => {
      const res = await fetch("/api/checklists/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedItems: items }),
      });
      return res.json();
    },
  });

  const toggleItem = (itemId: number) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      // Auto-save progress
      saveProgress.mutate(Array.from(newSet));
      return newSet;
    });
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addItem.mutate({ item: newItemText, category: newItemCategory });
    }
  };

  const categories = Object.keys(categoryConfig);
  const filteredItems =
    activeCategory === "all"
      ? checklistItems
      : checklistItems.filter((item) => item.category === activeCategory);

  const completedCount = checkedItems.size;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isReady = progressPercent === 100;

  // Group items by category
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-8 w-8" />
        Pre-Trip Checklist
      </h1>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Preparation Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} items completed
              </p>
            </div>
            {isReady ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Ready!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-6 w-6" />
                <span className="font-semibold">In Progress</span>
              </div>
            )}
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Readiness Alert */}
      {isReady && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">You're prepared!</AlertTitle>
          <AlertDescription className="text-green-700">
            All checklist items are complete. Remember to stay present, trust the process, and
            reach out to your support system if needed.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-6">
          {activeCategory === "all" ? (
            // Show all categories
            categories.map((category) => {
              const items = itemsByCategory[category];
              if (items.length === 0) return null;

              const config = categoryConfig[category];
              const Icon = config.icon;
              const categoryCompleted = items.filter((item) => checkedItems.has(item.id)).length;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="capitalize">{category}</span>
                      <span className="text-sm font-normal text-muted-foreground ml-auto">
                        {categoryCompleted}/{items.length}
                      </span>
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            checkedItems.has(item.id)
                              ? "bg-green-50 border-green-200"
                              : "bg-background hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            id={`item-${item.id}`}
                            checked={checkedItems.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`item-${item.id}`}
                              className={`font-medium cursor-pointer ${
                                checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {item.item}
                            </label>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {!item.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem.mutate(item.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Show single category
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryConfig[activeCategory] && (
                    <>
                      {(() => {
                        const Icon = categoryConfig[activeCategory].icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      <span className="capitalize">{activeCategory}</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {categoryConfig[activeCategory]?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        checkedItems.has(item.id)
                          ? "bg-green-50 border-green-200"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`item-${item.id}`}
                          className={`font-medium cursor-pointer ${
                            checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.item}
                        </label>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                      {!item.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem.mutate(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Custom Item */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Item
          </CardTitle>
          <CardDescription>
            Add your own preparation items to personalize your checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="newItem" className="sr-only">
                New item
              </Label>
              <Input
                id="newItem"
                placeholder="Enter a new checklist item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
            </div>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <Button onClick={handleAddItem} disabled={!newItemText.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Safety Reminder */}
      <Alert className="mt-6">
        <Shield className="h-4 w-4" />
        <AlertTitle>Safety First</AlertTitle>
        <AlertDescription>
          This checklist is designed to help you prepare safely. It's not a guarantee of safety.
          Always research substances thoroughly, start with low doses, and have a trusted person
          aware of your plans.
        </AlertDescription>
      </Alert>
    </div>
  );
}
