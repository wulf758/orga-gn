"use client";

import { ReactNode } from "react";

type CreatePanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function CreatePanel({ title, description, children }: CreatePanelProps) {
  return (
    <div className="detail-block">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="form-stack">{children}</div>
    </div>
  );
}
