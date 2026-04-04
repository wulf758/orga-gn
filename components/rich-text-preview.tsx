"use client";

import { Fragment, ReactNode } from "react";

type RichTextPreviewProps = {
  text: string;
};

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|https?:\/\/[^\s<>"']+)/g;
const IMAGE_URL_PATTERN = /^https?:\/\/[^\s<>"']+\.(?:png|jpe?g|gif|webp|svg|avif)(?:\?[^\s<>"']*)?$/i;

function cleanUrlToken(token: string) {
  return token.replace(/[),.;!?]+$/, "");
}

function isStandaloneImageUrl(text: string) {
  return IMAGE_URL_PATTERN.test(text.trim());
}

function renderInlineFormatting(text: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  match = INLINE_PATTERN.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`text-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    const token = match[0];

    if (token.startsWith("http://") || token.startsWith("https://")) {
      const href = cleanUrlToken(token);
      parts.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="rich-link"
        >
          {href}
        </a>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={`bold-${key++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("__") && token.endsWith("__")) {
      parts.push(<u key={`underline-${key++}`}>{token.slice(2, -2)}</u>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={`italic-${key++}`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = INLINE_PATTERN.lastIndex;
    match = INLINE_PATTERN.exec(text);
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
      {paragraphs.map((paragraph, index) => {
        const trimmedParagraph = paragraph.trim();

        if (isStandaloneImageUrl(trimmedParagraph)) {
          return (
            <figure className="rich-image-block" key={`${trimmedParagraph}-${index}`}>
              <a
                href={trimmedParagraph}
                target="_blank"
                rel="noreferrer noopener"
                className="rich-image-link"
              >
                <img
                  src={trimmedParagraph}
                  alt="Illustration integree depuis un lien"
                  className="rich-image"
                  loading="lazy"
                />
              </a>
              <figcaption>
                <a
                  href={trimmedParagraph}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rich-link"
                >
                  Ouvrir l'image
                </a>
              </figcaption>
            </figure>
          );
        }

        return <p key={`${paragraph}-${index}`}>{renderInlineFormatting(paragraph)}</p>;
      })}
    </>
  );
}
