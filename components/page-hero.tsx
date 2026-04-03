import { ReactNode } from "react";

type PageHeroProps = {
  kicker: string;
  title: string;
  copy: string;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function PageHero({
  kicker,
  title,
  copy,
  actions,
  aside
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="hero-card">
        <p className="hero-kicker">{kicker}</p>
        <h2 className="hero-title">{title}</h2>
        <p className="hero-copy">{copy}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      <div className="insight-column">{aside}</div>
    </section>
  );
}

