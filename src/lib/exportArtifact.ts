import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

const safeName = (t: string) => (t || "document").replace(/[^\w-]+/g, "_");

// Strip a thin layer of markdown for plain-text rendering (PDF/DOCX bodies)
const stripInline = (s: string) =>
  s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string; ordered: boolean };

const parseMarkdown = (md: string): Block[] => {
  const blocks: Block[] = [];
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3;
      blocks.push({ kind: (`h${level}` as "h1" | "h2" | "h3"), text: stripInline(h[2]) });
      continue;
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ul) { blocks.push({ kind: "li", text: stripInline(ul[1]), ordered: false }); continue; }
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ol) { blocks.push({ kind: "li", text: stripInline(ol[1]), ordered: true }); continue; }
    blocks.push({ kind: "p", text: stripInline(line) });
  }
  return blocks;
};

export const downloadMarkdown = (title: string, type: string, content: string) => {
  const md = `# ${title}\n\n_${type}_\n\n${content}`;
  saveAs(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${safeName(title)}.md`);
};

export const downloadPdf = (title: string, type: string, content: string) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 56;
  const marginTop = 64;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - marginX * 2;
  let y = marginTop;

  const ensureRoom = (h: number) => {
    if (y + h > pageH - marginTop) {
      doc.addPage();
      y = marginTop;
    }
  };

  const writeWrapped = (text: string, opts: { size: number; bold?: boolean; indent?: number; gap?: number }) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size);
    const indent = opts.indent ?? 0;
    const wrapped = doc.splitTextToSize(text, maxW - indent);
    const lineH = opts.size * 1.35;
    for (const ln of wrapped) {
      ensureRoom(lineH);
      doc.text(ln, marginX + indent, y);
      y += lineH;
    }
    y += opts.gap ?? 4;
  };

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(title, maxW);
  for (const ln of titleLines) { ensureRoom(26); doc.text(ln, marginX, y); y += 26; }
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(120);
  ensureRoom(18); doc.text(type, marginX, y); y += 18;
  doc.setTextColor(0);
  y += 6;

  for (const b of parseMarkdown(content)) {
    if (b.kind === "h1") { y += 6; writeWrapped(b.text, { size: 16, bold: true, gap: 6 }); }
    else if (b.kind === "h2") { y += 4; writeWrapped(b.text, { size: 13, bold: true, gap: 4 }); }
    else if (b.kind === "h3") { writeWrapped(b.text, { size: 12, bold: true, gap: 2 }); }
    else if (b.kind === "li") { writeWrapped(`• ${b.text}`, { size: 11, indent: 14, gap: 2 }); }
    else { writeWrapped(b.text, { size: 11, gap: 6 }); }
  }

  doc.save(`${safeName(title)}.pdf`);
};

export const downloadDocx = async (title: string, type: string, content: string) => {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: type, italics: true, color: "666666" })] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];

  for (const b of parseMarkdown(content)) {
    if (b.kind === "h1") children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(b.text)] }));
    else if (b.kind === "h2") children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(b.text)] }));
    else if (b.kind === "h3") children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(b.text)] }));
    else if (b.kind === "li") children.push(new Paragraph({ text: b.text, bullet: { level: 0 } }));
    else children.push(new Paragraph({ children: [new TextRun(b.text)] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${safeName(title)}.docx`);
};
