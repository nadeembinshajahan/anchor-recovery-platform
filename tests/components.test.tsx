/**
 * Behavioral component tests for the main flows: the fallback-first
 * contract (safe content renders instantly, AI swaps in on success, static
 * content survives failure) is the app's core resilience promise — these
 * tests pin it.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CaregiverClient from "@/app/caregiver/CaregiverClient";
import LearnClient from "@/app/learn/LearnClient";
import PlanForm from "@/app/plan/PlanForm";
import PreventClient from "@/app/prevent/PreventClient";
import SosFlow from "@/app/sos/SosFlow";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function mockFetchOk(text: string) {
  return vi.fn(async () => ({ ok: true, json: async () => ({ text }) }));
}

function mockFetchFail() {
  return vi.fn(async () => ({
    ok: false,
    status: 502,
    json: async () => ({ error: "Generation is temporarily unavailable." }),
  }));
}

beforeEach(() => {
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

describe("SosFlow", () => {
  it("shows the safe fallback script instantly, then swaps to the AI script", async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((r) => (resolveFetch = r))),
    );
    render(<SosFlow />);
    fireEvent.click(screen.getByRole("button", { name: /craving/i }));

    // Fallback is on screen BEFORE the network resolves.
    expect(screen.getByText(/You are safe in this moment/)).toBeInTheDocument();

    resolveFetch({ ok: true, json: async () => ({ text: "1. Personalized step one." }) });
    await waitFor(() =>
      expect(screen.getByText(/Personalized step one/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/You are safe in this moment/)).not.toBeInTheDocument();
  });

  it("keeps the fallback script when generation fails", async () => {
    vi.stubGlobal("fetch", mockFetchFail());
    render(<SosFlow />);
    fireEvent.click(screen.getByRole("button", { name: /overwhelmed/i }));
    await waitFor(() =>
      expect(screen.getByText(/You are safe in this moment/)).toBeInTheDocument(),
    );
  });
});

describe("PlanForm", () => {
  it("saves to localStorage and announces the confirmation", async () => {
    vi.stubGlobal("fetch", mockFetchOk("unused"));
    render(<PlanForm />);
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Meera" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+91 99999 88888" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save my plan/i }));

    await waitFor(() =>
      expect(screen.getByText(/saved on this device/i)).toBeInTheDocument(),
    );
    const stored = JSON.parse(window.localStorage.getItem("pulari.safetyPlan.v1") ?? "{}");
    expect(stored.name).toBe("Meera");
  });

  it("rejects an invalid phone number with an accessible error", async () => {
    render(<PlanForm />);
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: /save my plan/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(window.localStorage.getItem("pulari.safetyPlan.v1")).toBeNull();
  });

  it("clears data only on the second (armed) tap", async () => {
    render(<PlanForm />);
    const clear = screen.getByRole("button", { name: /clear my data/i });
    fireEvent.click(clear);
    expect(screen.getByRole("button", { name: /tap again to confirm/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tap again to confirm/i }));
    await waitFor(() =>
      expect(screen.getByText(/cleared from this device/i)).toBeInTheDocument(),
    );
  });
});

describe("LearnClient", () => {
  it("renders curated content and adds the AI explanation on demand", async () => {
    vi.stubGlobal("fetch", mockFetchOk("A simpler explanation."));
    const { container } = render(<LearnClient />);
    // Curated content is present without any network.
    expect(screen.getByText(/what would you like to understand/i)).toBeInTheDocument();

    const details = container.querySelector("details")!;
    details.open = true; // jsdom-safe accordion expand
    fireEvent.click(
      screen.getAllByRole("button", { name: /explain this simply/i })[0],
    );
    await waitFor(() =>
      expect(screen.getByText(/A simpler explanation/)).toBeInTheDocument(),
    );
  });
});

describe("PreventClient", () => {
  it("shows the ready-anyway plan immediately and swaps to the AI plan", async () => {
    vi.stubGlobal("fetch", mockFetchOk("Before: 1. A personalized preparation step."));
    render(<PreventClient />);
    fireEvent.click(screen.getByRole("button", { name: /wedding/i }));
    expect(screen.getByText(/no-thanks drink/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/personalized preparation step/i)).toBeInTheDocument(),
    );
  });
});

describe("CaregiverClient", () => {
  it("falls back to curated tips when the AI is unavailable", async () => {
    vi.stubGlobal("fetch", mockFetchFail());
    render(<CaregiverClient />);
    fireEvent.click(screen.getByRole("button", { name: /relapsed/i }));
    await waitFor(() =>
      expect(screen.getByText(/fundamentals apply/i)).toBeInTheDocument(),
    );
    // Curated tips list is rendered.
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(3);
  });
});
