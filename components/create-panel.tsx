"use client";

import { ReactNode, useState } from "react";

type CreatePanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function CreatePanel({ title, description, children }: CreatePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`detail-block create-panel${isExpanded ? " is-expanded" : ""}`}>
      <div className="create-panel-header">
        <div className="create-panel-copy">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className="create-panel-toggle"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Masquer" : "Ouvrir"}
        </button>
      </div>
      <div className="create-panel-body">
        <div className="form-stack">{children}</div>
      </div>
    </div>
  );
}
