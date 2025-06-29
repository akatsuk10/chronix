"use client";

import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingScreen = ({ 
  message = "Loading...", 
  size = "md",
  className = "" 
}: LoadingScreenProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#121212] ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[#44FDB3]`} />
        <p className="text-gray-400 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 