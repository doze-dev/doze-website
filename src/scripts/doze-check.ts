// "Check against your doze": the reader's doze version, from ?doze=0.1.1 or the
// last one they picked (localStorage, never sent anywhere). Marks the page:
//   <html data-doze="0.1.1">            the version, or absent when not checking
//   [data-needs="0.2.0"]                gets .dz-too-old when the version is older
//   [data-doze-when="set|unset"]        shown only in that state
//   [data-doze-text]                    filled with the version
//   [data-doze-pick="0.1.1" | ""]       links/buttons that set (or clear) it
const KEY = "doze-version";
const valid = (v: string | null) => !!v && /^\d+\.\d+\.\d+$/.test(v);
const older = (a: string, b: string) => {
  const pa = a.split(".").map(Number),
    pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i];
  return false;
};

function apply(v: string | null) {
  const root = document.documentElement;
  if (v) root.dataset.doze = v;
  else delete root.dataset.doze;
  for (const el of document.querySelectorAll<HTMLElement>("[data-needs]")) {
    el.classList.toggle("dz-too-old", !!v && older(v, el.dataset.needs!));
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-doze-when]")) {
    el.hidden = el.dataset.dozeWhen === "set" ? !v : !!v;
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-doze-text]")) el.textContent = v ?? "";
}

function current(): string | null {
  const q = new URLSearchParams(location.search).get("doze");
  if (valid(q)) {
    localStorage.setItem(KEY, q!);
    return q;
  }
  const saved = localStorage.getItem(KEY);
  return valid(saved) ? saved : null;
}

document.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-doze-pick]");
  if (!el) return;
  e.preventDefault();
  const v = el.dataset.dozePick || null;
  if (v) localStorage.setItem(KEY, v);
  else localStorage.removeItem(KEY);
  const url = new URL(location.href);
  if (v) url.searchParams.set("doze", v);
  else url.searchParams.delete("doze");
  history.replaceState(null, "", url);
  apply(v);
  el.closest("details")?.removeAttribute("open");
});

document.addEventListener("submit", (e) => {
  const form = (e.target as HTMLElement).closest<HTMLFormElement>("[data-doze-detect]");
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector("input");
  const found = input?.value.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null;
  if (!found) {
    input?.setCustomValidity("No version found: paste the line doze version prints");
    input?.reportValidity();
    return;
  }
  input?.setCustomValidity("");
  localStorage.setItem(KEY, found);
  const url = new URL(location.href);
  url.searchParams.set("doze", found);
  history.replaceState(null, "", url);
  apply(found);
  form.closest("details")?.removeAttribute("open");
});

apply(current());
