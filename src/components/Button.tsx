import React from "react";

interface ButtonProps {
  children: string;
  bg?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  disabled?: boolean; // ✅ Fixed: Changed to boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  bg = "primary",
  disabled = false, // ✅ Ensure default value is boolean
  className = "",
  onClick,
}) => {
  const getButtonBg = (bg: "primary" | "secondary") => {
    switch (bg) {
      case "primary":
        return "bg-[#213458]";
      case "secondary":
        return "bg-[#CF510E]";
      default:
        return "";
    }
  };

  const buttonBgStyle = getButtonBg(bg);

  return (
    <button
      onClick={onClick}
      disabled={disabled} // ✅ Correctly set disabled as boolean
      className={`w-[149px] h-[39px] text-center text-white p-2 font-medium ${buttonBgStyle} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} // ✅ Add disabled styles
        ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
