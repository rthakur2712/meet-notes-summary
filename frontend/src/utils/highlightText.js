// src/utils/highlightText.js
export default function highlightText(text, keyword) {
    if (!keyword.trim()) return text;
    const esc = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "gi");
    return text.replace(re, "<mark>$1</mark>");
  }
  