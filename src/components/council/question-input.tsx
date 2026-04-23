"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MicButton } from "./mic-button";

export function QuestionInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className="flex items-center gap-2"
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask the council…"
        className="flex-1"
        disabled={disabled}
      />
      <MicButton onTranscript={onChange} />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Ask
      </Button>
    </form>
  );
}
