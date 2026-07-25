/**
 * Page-level accessibility tests: every main flow is rendered and checked
 * against axe-core (WCAG rules), plus explicit assertions on the semantics
 * assistive tech depends on (headings, accessible names, chip group roles).
 */
import { cleanup, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CaregiverClient from "@/app/caregiver/CaregiverClient";
import Companion from "@/app/companion/Companion";
import LearnClient from "@/app/learn/LearnClient";
import PlanForm from "@/app/plan/PlanForm";
import PreventClient from "@/app/prevent/PreventClient";
import SosFlow from "@/app/sos/SosFlow";
import HotlineBar from "@/components/HotlineBar";
import Sidebar from "@/components/Sidebar";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
// Force the companion into deterministic chips mode: no mic in jsdom.
vi.mock("@/lib/liveClient", () => ({
  supportsLiveVoice: () => false,
  startLiveSession: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ text: "ok" }) })),
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("accessibility (axe) per flow", () => {
  it("SOS situation picker has no violations and a single h1", async () => {
    const { container } = render(<SosFlow />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("prevention flow has no violations and a single h1", async () => {
    const { container } = render(<PreventClient />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("safety plan form has no violations and every control is labeled", async () => {
    const { container } = render(<PlanForm />);
    for (const input of container.querySelectorAll("input")) {
      const labelled =
        input.getAttribute("aria-label") ||
        input.getAttribute("aria-labelledby") ||
        (input.id && container.querySelector(`label[for="${input.id}"]`));
      expect(labelled, `input ${input.outerHTML.slice(0, 80)} must be labeled`).toBeTruthy();
    }
    expect(await axe(container)).toHaveNoViolations();
  });

  it("plan language picker is a radiogroup; coping tools expose pressed state", () => {
    const { container } = render(<PlanForm />);
    const group = container.querySelector('[role="radiogroup"]');
    expect(group).toBeInTheDocument();
    expect(group?.querySelectorAll('[role="radio"][aria-checked]').length).toBeGreaterThan(2);
    expect(container.querySelectorAll("button[aria-pressed]").length).toBeGreaterThan(4);
  });

  it("learn topics have no violations", async () => {
    const { container } = render(<LearnClient />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("caregiver picker has no violations", async () => {
    const { container } = render(<CaregiverClient />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("companion (chips fallback mode) has no violations", async () => {
    const { container } = render(<Companion />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("hotline bar has no violations and every helpline is a tel: link", async () => {
    const { container } = render(<HotlineBar />);
    const tels = container.querySelectorAll('a[href^="tel:"]');
    expect(tels.length).toBeGreaterThanOrEqual(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sidebar navigation has no violations and marks the current page", async () => {
    const { container } = render(<Sidebar />);
    expect(container.querySelector('[aria-current="page"]')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
