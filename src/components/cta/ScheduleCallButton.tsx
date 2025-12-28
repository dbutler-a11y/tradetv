"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleCallButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

const CALENDLY_URL = "https://calendly.com/dbutler-eulaproperties/new-meeting";

export function ScheduleCallButton({
  variant = "default",
  size = "default",
  className = "",
  children,
}: ScheduleCallButtonProps) {
  const handleClick = () => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Calendar className="w-4 h-4 mr-2" />
      {children || "Schedule a Call"}
    </Button>
  );
}
