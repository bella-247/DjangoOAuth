import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className = "",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button-${variant}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
