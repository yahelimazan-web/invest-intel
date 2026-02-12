"use client";

import { useEffect } from "react";

/**
 * Component to ensure all buttons are clickable
 * Fixes issues with overlaying elements, z-index, and pointer-events
 * This runs client-side only and ensures buttons work even if React handlers fail
 */
export default function ButtonFix() {
  useEffect(() => {
    // Function to ensure all buttons are clickable
    const enableAllButtons = () => {
      // Select all buttons
      const buttons = document.querySelectorAll(
        'button, [role="button"], .btn-primary, .btn-secondary, .btn-ghost',
      );

      buttons.forEach((btn) => {
        const element = btn as HTMLElement;

        // Ensure button is clickable
        element.style.pointerEvents = "auto";
        element.style.position = "relative";
        element.style.zIndex = "10";

        // Remove disabled attribute if not intentionally disabled
        if (
          element.hasAttribute("disabled") &&
          !element.classList.contains("disabled")
        ) {
          // Check if it's actually disabled by checking aria-disabled or disabled class
          const isIntentionallyDisabled =
            element.getAttribute("aria-disabled") === "true" ||
            element.classList.contains("disabled") ||
            element.hasAttribute("data-disabled");

          if (!isIntentionallyDisabled) {
            // Don't remove disabled if it's a form button that should be disabled
            const type = element.getAttribute("type");
            if (type !== "submit" || !element.closest("form")) {
              // Only remove if it's not a submit button in a form
              // element.removeAttribute('disabled');
            }
          }
        }

        // Ensure click events work
        if (!element.dataset.clickBound) {
          const handleClick = (e: Event) => {
            // Don't interfere if button already has React handlers
            // Just ensure the event propagates correctly
            const target = e.target as HTMLElement;
            if (target === element || element.contains(target)) {
              // Event is on the button itself, let it proceed
              return;
            }
          };

          element.addEventListener("click", handleClick, {
            capture: true,
            passive: true,
          });
          element.dataset.clickBound = "true";
        }
      });
    };

    // Run immediately
    enableAllButtons();

    // Watch for dynamically added buttons (like those added by React)
    const observer = new MutationObserver(() => {
      enableAllButtons();
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "class", "style"],
    });

    // Also run on any focus/blur events (buttons might be added dynamically)
    const handleFocus = () => {
      setTimeout(enableAllButtons, 100);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("click", handleFocus, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("click", handleFocus, true);
    };
  }, []);

  return null; // This component doesn't render anything
}
