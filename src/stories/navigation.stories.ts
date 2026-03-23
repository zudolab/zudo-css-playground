import type { StoryMeta, StoryVariant } from "../lib/stories";

export const meta: StoryMeta = {
  title: "Navigation/Breadcrumbs",
};

export const Simple: StoryVariant = {
  name: "Simple Breadcrumb",
  html: `<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="#">Home</a></li>
    <li><a href="#">Products</a></li>
    <li aria-current="page">Widget</li>
  </ol>
</nav>`,
  css: `.breadcrumb ol {
  display: flex;
  gap: var(--space-xs);
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--font-sm);
}
.breadcrumb li + li::before {
  content: "/";
  color: var(--fg-muted);
  margin-right: var(--space-xs);
}
.breadcrumb a {
  color: var(--accent);
  text-decoration: none;
}
.breadcrumb a:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}
.breadcrumb [aria-current="page"] {
  color: var(--fg);
  font-weight: 500;
}`,
  height: 40,
};

export const WithIcons: StoryVariant = {
  name: "Breadcrumb with Icons",
  html: `<nav class="breadcrumb-icons" aria-label="Breadcrumb">
  <ol>
    <li><a href="#">&#x1F3E0; Home</a></li>
    <li><a href="#">&#x1F4E6; Products</a></li>
    <li aria-current="page">Widget</li>
  </ol>
</nav>`,
  css: `.breadcrumb-icons ol {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  list-style: none;
  padding: var(--space-xs) var(--space-sm);
  margin: 0;
  background: var(--bg-subtle);
  border-radius: var(--radius);
  font-size: var(--font-sm);
}
.breadcrumb-icons li + li::before {
  content: "›";
  color: var(--fg-muted);
  margin-right: var(--space-sm);
  font-size: var(--font-lg);
}
.breadcrumb-icons a {
  color: var(--accent);
  text-decoration: none;
}
.breadcrumb-icons a:hover {
  text-decoration: underline;
}
.breadcrumb-icons [aria-current="page"] {
  color: var(--fg);
}`,
  height: 50,
};
