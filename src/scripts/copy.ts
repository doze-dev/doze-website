// Copy buttons: <button data-copy="text"> copies its text; <button data-copy-from="#id">
// copies that element's text. The label flips to "Copied" for a moment.
document.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy], [data-copy-from]");
  if (!btn) return;
  const from = btn.dataset.copyFrom ? document.querySelector(btn.dataset.copyFrom) : null;
  const text = btn.dataset.copy ?? from?.textContent?.replace(/^\$ /gm, "") ?? "";
  try {
    await navigator.clipboard.writeText(text.trim());
    const label = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.textContent = label;
    }, 1400);
  } catch {
    // clipboard refused (insecure origin): leave the button as it is
  }
});
