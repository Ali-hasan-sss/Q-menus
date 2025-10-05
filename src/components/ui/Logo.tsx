"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-14 w-14",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  return (
    <div className={`relative  ${sizeClasses[size]} ${className}`}>
      <Image
        src="/images/logo.png"
        alt="QMenus"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}
