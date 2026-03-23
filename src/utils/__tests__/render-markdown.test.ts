import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../render-markdown";

describe("renderMarkdown", () => {
  it("renders plain text as paragraph", () => {
    expect(renderMarkdown("hello")).toBe("<p>hello</p>");
  });

  it("renders bold and italic", () => {
    expect(renderMarkdown("**bold** and *italic*")).toBe(
      "<p><strong>bold</strong> and <em>italic</em></p>",
    );
  });

  it("renders inline code", () => {
    expect(renderMarkdown("use `npm install`")).toBe(
      "<p>use <code>npm install</code></p>",
    );
  });

  it("renders unordered list", () => {
    const result = renderMarkdown("- item 1\n- item 2");
    expect(result).toBe("<ul><li>item 1</li><li>item 2</li></ul>");
  });

  it("renders ordered list", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toBe("<ol><li>first</li><li>second</li></ol>");
  });

  it("preserves preamble text before unordered list", () => {
    const result = renderMarkdown("Here are the items:\n- item 1\n- item 2");
    expect(result).toBe(
      "<p>Here are the items:</p><ul><li>item 1</li><li>item 2</li></ul>",
    );
  });

  it("preserves preamble text before ordered list", () => {
    const result = renderMarkdown("Steps:\n1. first\n2. second");
    expect(result).toBe(
      "<p>Steps:</p><ol><li>first</li><li>second</li></ol>",
    );
  });

  it("renders headings", () => {
    expect(renderMarkdown("# Title")).toBe("<h4>Title</h4>");
    expect(renderMarkdown("## Subtitle")).toBe("<h5>Subtitle</h5>");
  });

  it("escapes HTML in input", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });

  it("renders fenced code blocks", () => {
    const result = renderMarkdown("```js\nconsole.log(1)\n```");
    expect(result).toContain("<pre");
    expect(result).toContain("console.log(1)");
  });

  it("separates paragraphs by double newlines", () => {
    const result = renderMarkdown("paragraph 1\n\nparagraph 2");
    expect(result).toBe("<p>paragraph 1</p><p>paragraph 2</p>");
  });
});
