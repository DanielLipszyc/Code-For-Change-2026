import type { Submission } from "@/types/submission";

/**
 * Build a marker popup from DOM nodes. User-supplied fields are only ever set
 * through textContent, so submitted text can't inject HTML or script.
 */
export function buildPopupContent(
  submission: Submission,
  showPending: boolean,
  onShowDetails: () => void,
): HTMLElement {
  const root = document.createElement("div");
  root.style.minWidth = "150px";

  const addLine = (tag: string, text: string, cssText: string) => {
    if (root.childNodes.length > 0) root.appendChild(document.createElement("br"));
    const el = document.createElement(tag);
    el.style.cssText = cssText;
    el.textContent = text;
    root.appendChild(el);
  };

  addLine("b", `🌿 ${submission.plantName}`, "font-size: 14px; color: #136207;");
  if (submission.scientificName) {
    addLine("i", submission.scientificName, "color: #666; font-size: 12px;");
  }
  if (submission.notes) {
    addLine("span", submission.notes, "font-size: 12px;");
  }
  addLine(
    "span",
    `Spotted: ${new Date(submission.timestamp).toLocaleDateString()}`,
    "font-size: 11px; color: #888;",
  );
  if (showPending) {
    addLine("span", "⏳ Pending Approval", "font-size: 11px; color: #dc2626; font-weight: 600;");
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "More details";
  button.style.cssText =
    "display: block; margin-top: 10px; padding: 8px 12px; background: #136207; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; font-weight: 600;";
  button.addEventListener("click", onShowDetails);
  root.appendChild(button);

  return root;
}
