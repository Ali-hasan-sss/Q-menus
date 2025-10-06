import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg" | "xl";
  hover?: boolean;
}

export function Card({
  children,
  padding = "md",
  shadow = "sm",
  hover = false,
  className,
  ...props
}: CardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const shadowClasses = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        //  paddingClasses[padding],
        shadowClasses[shadow],
        hover &&
          "hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
