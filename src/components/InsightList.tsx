import type { ReactNode } from "react";

type InsightListProps = {
  icon: ReactNode;
  title: string;
  items: string[];
  empty: string;
};

export function InsightList({ icon, title, items, empty }: InsightListProps) {
  return (
    <section className="insight-list">
      <h3>
        {icon}
        {title}
      </h3>
      <ul>
        {(items.length ? items : [empty]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
