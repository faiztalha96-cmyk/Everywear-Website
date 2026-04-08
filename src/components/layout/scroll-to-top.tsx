import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Prevent the browser from automatically restoring the scroll position on reload
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll to the top instantly on initial mount and route changes
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
