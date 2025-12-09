"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";
import { Input } from "@myprotocolstack/ui";
import { Button } from "@myprotocolstack/ui";
import { Badge } from "@myprotocolstack/ui";
import { Checkbox } from "@myprotocolstack/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@myprotocolstack/ui";
import { createClient } from "@myprotocolstack/database/client";
import { toast } from "sonner";
import type { Protocol, ProtocolCategory } from "@myprotocolstack/database";
import { FavoriteButton } from "@/components/protocols/favorite-button";

interface StackBuilderProps {
  protocols: Protocol[];
  favoriteIds?: string[];
  initialStack?: {
    id: string;
    name: string;
    description: string | null;
    protocol_ids: string[];
    schedule: string;
    is_active: boolean;
  };
}

const categoryLabels: Record<ProtocolCategory, { label: string; icon: string }> = {
  sleep: { label: "Sleep", icon: "🌙" },
  focus: { label: "Focus", icon: "🎯" },
  energy: { label: "Energy", icon: "⚡" },
  fitness: { label: "Fitness", icon: "💪" },
};

const scheduleOptions = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
];

export function StackBuilder({ protocols, favoriteIds = [], initialStack }: StackBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const [name, setName] = useState(initialStack?.name || "");
  const [description, setDescription] = useState(initialStack?.description || "");
  const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(
    new Set(initialStack?.protocol_ids || [])
  );
  const [schedule, setSchedule] = useState(initialStack?.schedule || "daily");
  const [isActive, setIsActive] = useState(initialStack?.is_active ?? true);

  // Group protocols by category
  const groupedProtocols = protocols.reduce(
    (acc, protocol) => {
      if (!acc[protocol.category]) {
        acc[protocol.category] = [];
      }
      acc[protocol.category].push(protocol);
      return acc;
    },
    {} as Record<ProtocolCategory, Protocol[]>
  );

  const toggleProtocol = (id: string) => {
    setSelectedProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a stack name");
      return;
    }

    if (selectedProtocols.size === 0) {
      toast.error("Please select at least one protocol");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const stackData = {
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      protocol_ids: Array.from(selectedProtocols),
      schedule,
      is_active: isActive,
    };

    let error;

    if (initialStack) {
      // Update existing stack
      const result = await supabase
        .from("stacks")
        .update(stackData)
        .eq("id", initialStack.id);
      error = result.error;
    } else {
      // Create new stack
      const result = await supabase.from("stacks").insert(stackData);
      error = result.error;
    }

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(initialStack ? "Stack updated!" : "Stack created!");

    startTransition(() => {
      router.push("/stacks");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stack details */}
      <Card>
        <CardHeader>
          <CardTitle>Stack Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <Input
              placeholder="e.g., Morning Routine, Sleep Stack"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What's this stack for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Schedule</label>
            <div className="flex gap-2 mt-1">
              {scheduleOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={schedule === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSchedule(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <label htmlFor="active" className="text-sm">
              Active (show in Today view)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Protocol selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Protocols</CardTitle>
            <Badge variant="secondary">
              {selectedProtocols.size} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sleep">
            <TabsList className="grid w-full grid-cols-4">
              {(Object.keys(categoryLabels) as ProtocolCategory[]).map(
                (category) => (
                  <TabsTrigger key={category} value={category}>
                    {categoryLabels[category].icon} {categoryLabels[category].label}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            {(Object.keys(categoryLabels) as ProtocolCategory[]).map(
              (category) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="space-y-2">
                    {groupedProtocols[category]?.map((protocol) => (
                      <div
                        key={protocol.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProtocols.has(protocol.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() => toggleProtocol(protocol.id)}
                      >
                        <div
                          className="mt-0.5 pointer-events-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedProtocols.has(protocol.id)}
                            tabIndex={-1}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{protocol.name}</span>
                            <FavoriteButton
                              protocolId={protocol.id}
                              isFavorite={favoriteIds.includes(protocol.id)}
                              className="h-6 w-6"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {protocol.description}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {protocol.difficulty}
                            </Badge>
                            {protocol.duration_minutes && (
                              <span className="text-xs text-muted-foreground">
                                {protocol.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected protocols summary */}
      {selectedProtocols.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Stack ({selectedProtocols.size} protocols)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedProtocols).map((id) => {
                const protocol = protocols.find((p) => p.id === id);
                if (!protocol) return null;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleProtocol(id)}
                  >
                    {categoryLabels[protocol.category].icon} {protocol.name} ×
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : initialStack
              ? "Update Stack"
              : "Create Stack"}
        </Button>
      </div>
    </form>
  );
}
