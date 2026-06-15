import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { DISCLAIMER } from "@/lib/constants";

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 56;
const FOOTER_RESERVE = 78;
const NAVY = rgb(0.086, 0.165, 0.29);
const GREY = rgb(0.45, 0.45, 0.45);
const LIGHT = rgb(0.6, 0.6, 0.6);

export type BlockType =
  | "h1"
  | "h2"
  | "h3"
  | "para"
  | "small"
  | "spacer"
  | "rule";

export interface Block {
  type: BlockType;
  text?: string;
  /** Left indent in points. */
  indent?: number;
}

export interface PdfOptions {
  footerLabel: string;
  compiledDate: string;
  blocks: Block[];
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildPdf(opts: PdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const contentWidth = A4.w - MARGIN * 2;
  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + FOOTER_RESERVE) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN;
    }
  }

  function drawLines(
    text: string,
    font: PDFFont,
    size: number,
    lineGap: number,
    color = NAVY,
    indent = 0,
  ) {
    const lines = wrap(text, font, size, contentWidth - indent);
    for (const line of lines) {
      ensureSpace(size + lineGap);
      page.drawText(line, {
        x: MARGIN + indent,
        y: y - size,
        size,
        font,
        color,
      });
      y -= size + lineGap;
    }
  }

  for (const block of opts.blocks) {
    switch (block.type) {
      case "h1":
        ensureSpace(28);
        drawLines(block.text ?? "", serif, 18, 8, NAVY);
        y -= 4;
        break;
      case "h2":
        y -= 6;
        drawLines(block.text ?? "", bold, 12, 5, NAVY);
        break;
      case "h3":
        drawLines(block.text ?? "", bold, 10.5, 4, NAVY);
        break;
      case "para":
        drawLines(block.text ?? "", body, 10.5, 4, NAVY, block.indent ?? 0);
        y -= 4;
        break;
      case "small":
        drawLines(block.text ?? "", body, 8.5, 3, GREY, block.indent ?? 0);
        break;
      case "spacer":
        y -= block.indent ?? 8;
        break;
      case "rule":
        ensureSpace(10);
        page.drawLine({
          start: { x: MARGIN, y: y - 4 },
          end: { x: A4.w - MARGIN, y: y - 4 },
          thickness: 0.5,
          color: rgb(0.85, 0.82, 0.75),
        });
        y -= 12;
        break;
    }
  }

  // Footers on every page: disclaimer + page X of Y.
  const pages = pdf.getPages();
  const total = pages.length;
  const disclaimerLines = wrap(DISCLAIMER, body, 6.5, contentWidth);
  pages.forEach((pg, i) => {
    let fy = MARGIN + 48;
    pg.drawLine({
      start: { x: MARGIN, y: fy + 6 },
      end: { x: A4.w - MARGIN, y: fy + 6 },
      thickness: 0.5,
      color: rgb(0.85, 0.82, 0.75),
    });
    pg.drawText(
      `Page ${i + 1} of ${total}  |  ${opts.footerLabel}  |  Compiled ${opts.compiledDate}`,
      { x: MARGIN, y: fy, size: 7, font: body, color: LIGHT },
    );
    fy -= 10;
    for (const line of disclaimerLines) {
      pg.drawText(line, {
        x: MARGIN,
        y: fy,
        size: 6.5,
        font: body,
        color: LIGHT,
      });
      fy -= 8;
    }
  });

  return pdf.save();
}
