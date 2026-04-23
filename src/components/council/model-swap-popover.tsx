"use client";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type FreeModel = { id: string; context_length: number };

export function ModelSwapPopover({
  current,
  onPick,
  children,
}: {
  current: string;
  onPick: (modelId: string) => void;
  children: React.ReactNode;
}) {
  const [models, setModels] = useState<FreeModel[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { models?: FreeModel[] }) => setModels(d.models ?? []));
  }, []);
  const filtered = models.filter((m) =>
    m.id.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Popover>
      <PopoverTrigger className="w-full text-left outline-none">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <Input
          placeholder="Search free models…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-64">
          <ul className="space-y-0.5">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => onPick(m.id)}
                  className={`w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-muted ${
                    m.id === current ? "bg-muted font-medium" : ""
                  }`}
                  title={m.id}
                >
                  {m.id}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-1 text-xs text-muted-foreground">
                No free models matching.
              </li>
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
