const storedTheme = localStorage.getItem("dicionario-theme");
const isDark = storedTheme
  ? storedTheme === "dark"
  : window.matchMedia("(prefers-color-scheme: dark)").matches;

document.documentElement.classList.toggle("dark", isDark);
document
  .querySelector('meta[name="theme-color"]')
  ?.setAttribute("content", isDark ? "#0a0a0b" : "#ffffff");
