import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  label?: string;
  className?: string;
  isRTL?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  color = "primary",
  label,
  className = "",
  isRTL = false,
}) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    primary: checked ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700",
    success: checked ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700",
    warning: checked ? "bg-yellow-600" : "bg-gray-200 dark:bg-gray-700",
    danger: checked ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700",
  };

  const thumbPositionClasses = {
    sm: checked
      ? isRTL
        ? "-translate-x-4"
        : "translate-x-4"
      : isRTL
        ? "-translate-x-0.5"
        : "translate-x-0.5",
    md: checked
      ? isRTL
        ? "-translate-x-5"
        : "translate-x-5"
      : isRTL
        ? "-translate-x-0.5"
        : "translate-x-0.5",
    lg: checked
      ? isRTL
        ? "-translate-x-7"
        : "translate-x-7"
      : isRTL
        ? "-translate-x-0.5"
        : "translate-x-0.5",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            ${thumbSizeClasses[size]}
            ${thumbPositionClasses[size]}
            pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          `}
        />
      </button>
      {label && (
        <span
          className={`${isRTL ? "mr-3" : "ml-3"} text-sm font-medium text-gray-700 dark:text-gray-300`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Switch;
