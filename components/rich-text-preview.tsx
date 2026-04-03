"use client";

import { Fragment, ReactNode } from "react";

type RichTextPreviewProps = {
  text: string;
};

function renderInlineFormatting(text: string) {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  match = pattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={`bold-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("__") && token.endsWith("__")) {
      parts.push(<u key={`underline-${key++}`}>{token.slice(2, -2)}</u>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={`italic-${key++}`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`text-${key++}`}>{text.slice(lastIndex)}</Fragment>
    );
  }

  return parts;
}

export function RichTextPreview({ text }: RichTextPreviewProps) {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{renderInlineFormatting(paragraph)}</p>
      ))}
    </>
  );
}
