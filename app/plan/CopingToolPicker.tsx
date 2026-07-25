"use client";

/**
 * Section 02 of the safety plan: preset coping-tool toggle chips (zero
 * typing for the common case) plus an optional free-text add. Custom
 * tools render as removable active chips.
 */
import { useState } from "react";
import { FIELD_CLASSES, PRESET_TOOLS } from "./planFields";

interface CopingToolPickerProps {
  copingTools: string[];
  onToggle: (tool: string) => void;
  onAdd: (tool: string) => void;
}

export default function CopingToolPicker({
  copingTools,
  onToggle,
  onAdd,
}: CopingToolPickerProps) {
  const [customTool, setCustomTool] = useState("");

  const addCustomTool = () => {
    const tool = customTool.trim().slice(0, 100);
    if (!tool || copingTools.includes(tool)) return;
    onAdd(tool);
    setCustomTool("");
  };

  const customTools = copingTools.filter(
    (t) => !PRESET_TOOLS.includes(t as (typeof PRESET_TOOLS)[number]),
  );

  return (
    <fieldset className="plan-section plan-tools-section">
      <legend className="plan-section-heading">
        <span aria-hidden="true" className="plan-step">
          02
        </span>
        <span className="plan-legend-copy">
          <span className="eyebrow">Your go-to actions</span>
          <strong>Coping tools that work for you</strong>
        </span>
      </legend>
      <div className="plan-tools">
        {PRESET_TOOLS.map((tool) => {
          const active = copingTools.includes(tool);
          return (
            <button
              key={tool}
              type="button"
              onClick={() => onToggle(tool)}
              aria-pressed={active}
              className={`plan-tool lift ${active ? "plan-tool-active" : ""}`}
            >
              <span aria-hidden="true" className="plan-tool-check">
                ✓
              </span>
              {tool}
            </button>
          );
        })}
        {customTools.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onToggle(tool)}
            aria-pressed={true}
            aria-label={`Remove coping tool: ${tool}`}
            title="Tap to remove"
            className="plan-tool plan-tool-active plan-tool-custom lift"
          >
            <span aria-hidden="true" className="plan-tool-check">
              ✓
            </span>
            {tool}
            <span aria-hidden="true" className="plan-tool-remove">
              ×
            </span>
          </button>
        ))}
      </div>
      <div className="plan-custom-tool">
        <label htmlFor="plan-custom-tool" className="sr-only">
          Add your own coping tool
        </label>
        <input
          id="plan-custom-tool"
          type="text"
          value={customTool}
          onChange={(e) => setCustomTool(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomTool();
            }
          }}
          maxLength={100}
          placeholder="Add your own…"
          className={`${FIELD_CLASSES} plan-custom-input`}
        />
        <button type="button" onClick={addCustomTool} className="plan-add-tool lift">
          <span aria-hidden="true">+</span>
          Add
        </button>
      </div>
    </fieldset>
  );
}
