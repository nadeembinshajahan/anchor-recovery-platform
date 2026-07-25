import { describe, expect, it } from "vitest";
import {
  catalogueForPrompt,
  extractCitations,
  VERIFIED_SOURCES,
} from "@/lib/sources";

describe("extractCitations", () => {
  it("resolves known ids in first-use order", () => {
    const { sources } = extractCitations(
      "Cravings peak and pass [S3]. Family support helps [S8]. See also [S3].",
    );
    expect(sources.map((s) => s.id)).toEqual(["S3", "S8"]);
  });

  it("dedupes repeated citations of the same source", () => {
    const { sources } = extractCitations("A [S1]. B [S1]. C [S1].");
    expect(sources).toHaveLength(1);
    expect(sources[0].id).toBe("S1");
  });

  it("drops unknown ids from sources while still stripping the marker", () => {
    const { display, sources } = extractCitations(
      "A made-up claim [S99] and a real one [S2].",
    );
    expect(sources.map((s) => s.id)).toEqual(["S2"]);
    expect(display).not.toContain("[S99]");
    expect(display).not.toContain("[S2]");
  });

  it("strips markers from display text and collapses doubled spaces", () => {
    const { display } = extractCitations("Fact one [S1] and fact two [S2] here.");
    expect(display).toBe("Fact one and fact two here.");
  });

  it("passes citation-free text through unchanged", () => {
    const text = "Just a warm, plain answer with no references at all.";
    const { display, sources } = extractCitations(text);
    expect(display).toBe(text);
    expect(sources).toEqual([]);
  });
});

describe("catalogueForPrompt", () => {
  it("contains every verified source id and org", () => {
    const catalogue = catalogueForPrompt();
    for (const source of VERIFIED_SOURCES) {
      expect(catalogue).toContain(`[${source.id}]`);
      expect(catalogue).toContain(source.org);
    }
  });
});
