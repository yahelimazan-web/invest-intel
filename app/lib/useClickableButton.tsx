"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to ensure buttons are always clickable
 * Fixes issues with overlaying elements, z-index, and pointer-events
 */
export function useClickableButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Ensure button is clickable
    button.style.pointerEvents = "auto";
    button.style.position = "relative";
    button.style.zIndex = "10";

    // Ensure button is not disabled
    if (button.hasAttribute("disabled")) {
      // Only remove disabled if it's not intentionally disabled
      const isIntentionallyDisabled = button.getAttribute("aria-disabled") === "true" ||
        button.classList.contains("disabled");
      if (!isIntentionallyDisabled) {
        button.removeAttribute("disabled");
      }
    }

    // Add click handler if missing
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      // If button has onClick handler, it will be called
      // This ensures the click event is properly handled
      if (button.onclick) {
        button.onclick(e as any);
      }
    };

    button.addEventListener("click", handleClick, { capture: true });

    return () => {
      button.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return buttonRef;
}

/**
 * Higher-order component to wrap buttons and ensure they're clickable
 */
export function ClickableButton({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Force clickability
    button.style.pointerEvents = disabled ? "none" : "auto";
    button.style.position = "relative";
    button.style.zIndex = "10";
  }, [disabled]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        position: "relative",
        zIndex: 10,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
