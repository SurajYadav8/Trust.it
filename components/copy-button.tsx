"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Copy link",
  size = "sm",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Button variant="secondary" size={size} onClick={onCopy}>
      {copied ? "Copied" : label}
    </Button>
  );
}
