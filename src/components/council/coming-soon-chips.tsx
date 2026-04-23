import { Badge } from "@/components/ui/badge";

export function ComingSoonChips() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="outline" className="opacity-60">
        Each seat speaks · coming soon
      </Badge>
      <Badge variant="outline" className="opacity-60">
        Realtime talk · coming soon
      </Badge>
    </div>
  );
}
