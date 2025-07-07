import { useEffect } from 'react';

interface StyleRule {
  id: string;
  css: string;
}

export function useDynamicStyles(rules: StyleRule[]) {
  useEffect(() => {
    // Remove existing styles
    rules.forEach(rule => {
      const existing = document.getElementById(rule.id);
      if (existing) {
        existing.remove();
      }
    });

    // Add new styles
    rules.forEach(rule => {
      const style = document.createElement('style');
      style.id = rule.id;
      style.innerHTML = rule.css;
      document.head.appendChild(style);
    });

    // Cleanup function
    return () => {
      rules.forEach(rule => {
        const style = document.getElementById(rule.id);
        if (style) {
          style.remove();
        }
      });
    };
  }, [rules]);
}
