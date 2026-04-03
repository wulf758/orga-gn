"use client";

import { CSSProperties } from "react";

import { findTagDefinition } from "@/lib/tags";
import { TagDefinition } from "@/lib/types";

type TagBadgeProps = {
  tag: string;
  definitions: TagDefinition[];
  className?: string;
};

export function TagBadge({ tag, definitions, className }: TagBadgeProps) {
  const definition = findTagDefinition(definitions, tag);
  const style = definition
    ? ({
        "--tag-accent": definition.color
      } as CSSProperties)
    : undefined;

  return (
    <span className={["badge", "tag-badge", className].filter(Boolean).join(" ")} style={style}>
      {tag}
    </span>
  );
}
