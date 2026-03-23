import { useState } from "react";

// Static categories populated by AI chat (update-sidebar-nav.ts still works)
const aiCategories: { slug: string; label: string; count: number }[] = [
  { slug: "header-menus", label: "Header Menus", count: 10 },
  { slug: "buttons", label: "Buttons", count: 10 },
  { slug: "tab-menus", label: "Tab Menus", count: 10 },
];

interface Props {
  activeCategory?: string;
  storyCategories?: { slug: string; label: string; count: number }[];
}

export default function SidebarNav({
  activeCategory,
  storyCategories = [],
}: Props) {
  const [filter, setFilter] = useState("");

  // Merge AI categories with story categories
  const allCategories = [...aiCategories, ...storyCategories];

  const filtered = filter
    ? allCategories.filter((cat) =>
        cat.label.toLowerCase().includes(filter.toLowerCase()),
      )
    : allCategories;

  return (
    <nav>
      {/* Search filter input */}
      <div className="mb-vsp-sm">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter categories..."
          aria-label="Filter categories"
          className="w-full px-hsp-sm py-vsp-2xs rounded text-small bg-bg border border-muted/20 text-fg placeholder:text-muted/50 outline-none focus:border-accent/50"
        />
      </div>
      <ul className="list-none p-0 m-0 space-y-vsp-2xs">
        {filtered.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <li key={cat.slug}>
              <a
                href={`/${cat.slug}`}
                className={`block px-hsp-sm py-vsp-2xs rounded text-small no-underline transition-colors ${
                  isActive
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-fg hover:bg-surface hover:text-accent-hover"
                }`}
              >
                {cat.label}
                <span className="text-muted text-caption ml-hsp-xs">
                  ({cat.count})
                </span>
              </a>
            </li>
          );
        })}
        {filtered.length === 0 && filter && (
          <li className="px-hsp-sm py-vsp-2xs text-small text-muted/50">
            No matches
          </li>
        )}
      </ul>
    </nav>
  );
}
