import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AiText, { parseBlocks } from "@/components/AiText";

describe("AiText", () => {
  it("renders numbered model output as list items", () => {
    const text = "1. Breathe in slowly.\n2. Hold for four counts.\n3. Let it out.";
    render(<AiText text={text} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Breathe in slowly.")).toBeInTheDocument();
  });

  it("strips markdown bold markers", () => {
    render(<AiText text="You are **safe** right now." />);
    expect(screen.getByText("You are safe right now.")).toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it("renders paragraphs for plain prose blocks", () => {
    const { container } = render(
      <AiText text={"First paragraph here.\n\nSecond paragraph here."} />,
    );
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("renders bulleted lines as a list", () => {
    render(<AiText text={"- Drink water\n- Call a friend"} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("does not crash on empty input", () => {
    const { container } = render(<AiText text="" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the read-aloud control for signed AI text", () => {
    render(
      <AiText
        text="A signed answer."
        speak={{ sig: "b".repeat(64), autoplay: false }}
      />,
    );
    expect(screen.getByRole("button", { name: /listen/i })).toBeInTheDocument();
  });

  it("renders no read-aloud control without a signature (fallback text)", () => {
    render(<AiText text="Unsigned fallback script." speak={{ sig: null }} />);
    expect(screen.queryByRole("button", { name: /listen/i })).not.toBeInTheDocument();
  });

  it("renders no read-aloud control when speak is omitted", () => {
    render(<AiText text="Plain text." />);
    expect(screen.queryByRole("button", { name: /listen/i })).not.toBeInTheDocument();
  });
});

describe("parseBlocks", () => {
  it("detects numbered, dashed, and bullet-char lists", () => {
    expect(parseBlocks("1. a\n2. b")[0].kind).toBe("list");
    expect(parseBlocks("- a\n- b")[0].kind).toBe("list");
    expect(parseBlocks("• a\n• b")[0].kind).toBe("list");
  });

  it("treats a single marker line as a paragraph, not a one-item list", () => {
    expect(parseBlocks("1. lonely line")[0].kind).toBe("paragraph");
  });

  it("treats mixed blocks (marker + prose lines) as paragraphs", () => {
    expect(parseBlocks("1. step one\nbut this is prose")[0].kind).toBe("paragraph");
  });

  it("splits blocks on blank lines and strips bold markers", () => {
    const blocks = parseBlocks("**Intro** text.\n\n1. one\n2. two");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].lines[0]).toBe("Intro text.");
    expect(blocks[1].kind).toBe("list");
  });

  it("returns an empty array for whitespace-only input", () => {
    expect(parseBlocks("  \n\n  ")).toEqual([]);
  });
});
