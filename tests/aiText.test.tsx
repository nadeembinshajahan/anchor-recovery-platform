import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AiText from "@/components/AiText";

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
});
