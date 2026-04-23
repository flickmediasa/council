"use client";
import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

export function MicButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();
  useEffect(() => {
    if (transcript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  if (!supported) {
    return (
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled
        title="Voice input needs Chrome or Edge"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }
  return (
    <Button
      type="button"
      size="icon"
      variant={listening ? "destructive" : "outline"}
      onClick={listening ? stop : start}
      aria-label={listening ? "Stop listening" : "Start voice input"}
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
