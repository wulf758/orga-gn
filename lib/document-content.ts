import { DocumentPage } from "@/lib/types";

type DocumentContentBlock = DocumentPage["content"][number];

function normalizeParagraph(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function serializeDocumentContent(
  content: DocumentPage["content"],
  fallbackHeading: string
) {
  return content
    .map((block, index) => {
      const lines: string[] = [];
      const heading = block.heading?.trim() || (index === 0 ? fallbackHeading : `Section ${index + 1}`);

      lines.push(`## ${heading}`);

      if (block.paragraphs.length) {
        lines.push("");
        lines.push(...block.paragraphs);
      }

      if (block.bullets?.length) {
        lines.push("");
        lines.push(...block.bullets.map((bullet) => `- ${bullet}`));
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

export function parseDocumentContent(text: string, fallbackHeading: string): DocumentPage["content"] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: DocumentContentBlock[] = [];

  let current: DocumentContentBlock = {
    heading: fallbackHeading,
    paragraphs: [],
    bullets: []
  };
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    const paragraph = normalizeParagraph(paragraphBuffer);
    if (paragraph) {
      current.paragraphs.push(paragraph);
    }
    paragraphBuffer = [];
  }

  function pushCurrent() {
    flushParagraph();
    if (current.paragraphs.length || current.bullets?.length || current.heading.trim()) {
      sections.push({
        heading: current.heading.trim() || fallbackHeading,
        paragraphs: current.paragraphs,
        bullets: current.bullets?.length ? current.bullets : undefined
      });
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^#{1,2}\s+(.+)$/);
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (headingMatch) {
      if (current.paragraphs.length || current.bullets?.length || paragraphBuffer.length) {
        pushCurrent();
      }

      current = {
        heading: headingMatch[1].trim(),
        paragraphs: [],
        bullets: []
      };
      continue;
    }

    if (!line) {
      flushParagraph();
      continue;
    }

    if (bulletMatch) {
      flushParagraph();
      current.bullets = current.bullets ?? [];
      current.bullets.push(bulletMatch[1].trim());
      continue;
    }

    paragraphBuffer.push(line);
  }

  pushCurrent();

  return sections.length
    ? sections
    : [
        {
          heading: fallbackHeading,
          paragraphs: []
        }
      ];
}
