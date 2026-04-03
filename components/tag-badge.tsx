"use client";

import { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { findTagDefinition, normalizeTagLabel } from "@/lib/tags";
import { TagDefinition } from "@/lib/types";

type TagBadgeProps = {
  tag: string;
  definitions: TagDefinition[];
  className?: string;
  interactive?: boolean;
};

export function TagBadge({ tag, definitions, className, interactive = true }: TagBadgeProps) {
  const router = useRouter();
  const definition = findTagDefinition(definitions, tag);
  const style = definition
    ? ({
        "--tag-accent": definition.sectionColor
      } as CSSProperties)
    : undefined;
  const href = `/tags/${encodeURIComponent(normalizeTagLabel(tag))}`;

  function handleNavigate() {
    if (!interactive) return;
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      handleNavigate();
    }
  }

  return (
    <span
      className={[
        "badge",
        "tag-badge",
        interactive ? "tag-badge-interactive" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              handleNavigate();
            }
          : undefined
      }
      onKeyDown={handleKeyDown}
    >
      {tag}
    </span>
  );
}
