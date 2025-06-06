import { useState, useEffect } from "react";
import { getFitZoom } from "@/app/utils/zoom";

export function useFitZoom() {
  const [fitZoom, setFitZoom] = useState(() => getFitZoom(window.innerWidth, window.innerHeight));

  useEffect(() => {
    function handleResize() {
      setFitZoom(getFitZoom(window.innerWidth, window.innerHeight));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return fitZoom;
} 