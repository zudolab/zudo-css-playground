const categories = [
  { slug: "headers", label: "Headers", count: 8 },
  { slug: "cards", label: "Cards", count: 8 },
  { slug: "forms", label: "Forms", count: 6 },
  { slug: "tabs", label: "Tabs", count: 6 },
  { slug: "toasts", label: "Toasts", count: 4 },
  { slug: "footers", label: "Footers", count: 4 },
];

interface Props {
  activeCategory?: string;
}

export default function SidebarNav({ activeCategory }: Props) {
  return (
    <nav>
      <ul className="list-none p-0 m-0 space-y-vsp-2xs">
        {categories.map((cat) => {
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
      </ul>
    </nav>
  );
}
