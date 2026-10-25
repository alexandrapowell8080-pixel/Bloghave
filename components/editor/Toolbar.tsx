"use client";

import type { Editor } from "@tiptap/react";

const colors = ["#1c1712", "#e23d28", "#1f6f66", "#8d6b32"];
const marks = ["#f6de9a", "#cde7e3", "#f8d0c8"];

export function Toolbar({
  editor,
  onImage,
  onLink,
}: {
  editor: Editor | null;
  onImage: () => void;
  onLink: () => void;
}) {
  const item = (label: string, command: (editor: Editor) => void, pressed = false, title = label) => (
    <button type="button" title={title} aria-label={title} aria-pressed={pressed} disabled={!editor} onClick={() => editor && command(editor)}>
      {label}
    </button>
  );
  return (
    <div className="tool" role="toolbar" aria-label="Writing tools">
      {item("B", (editor) => editor.chain().focus().toggleBold().run(), !!editor?.isActive("bold"), "Bold")}
      {item("I", (editor) => editor.chain().focus().toggleItalic().run(), !!editor?.isActive("italic"), "Italic")}
      {item("U", (editor) => editor.chain().focus().toggleUnderline().run(), !!editor?.isActive("underline"), "Underline")}
      {item("S", (editor) => editor.chain().focus().toggleStrike().run(), !!editor?.isActive("strike"), "Strike")}
      <span className="split" />
      {item("H2", (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(), !!editor?.isActive("heading", { level: 2 }), "Heading 2")}
      {item("H3", (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(), !!editor?.isActive("heading", { level: 3 }), "Heading 3")}
      {item("H4", (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(), !!editor?.isActive("heading", { level: 4 }), "Heading 4")}
      <span className="split" />
      {item("L", (editor) => editor.chain().focus().setTextAlign("left").run(), editor?.isActive({ textAlign: "left" }), "Align left")}
      {item("C", (editor) => editor.chain().focus().setTextAlign("center").run(), editor?.isActive({ textAlign: "center" }), "Align center")}
      {item("R", (editor) => editor.chain().focus().setTextAlign("right").run(), editor?.isActive({ textAlign: "right" }), "Align right")}
      <span className="split" />
      {item("•", (editor) => editor.chain().focus().toggleBulletList().run(), !!editor?.isActive("bulletList"), "Bullet list")}
      {item("1.", (editor) => editor.chain().focus().toggleOrderedList().run(), !!editor?.isActive("orderedList"), "Numbered list")}
      {item("☑", (editor) => editor.chain().focus().toggleTaskList().run(), !!editor?.isActive("taskList"), "Checklist")}
      {item("“”", (editor) => editor.chain().focus().toggleBlockquote().run(), !!editor?.isActive("blockquote"), "Quote")}
      {item("</>", (editor) => editor.chain().focus().toggleCodeBlock().run(), !!editor?.isActive("codeBlock"), "Code")}
      {item("—", (editor) => editor.chain().focus().setHorizontalRule().run(), false, "Rule")}
      <span className="split" />
      {item("x₂", (editor) => editor.chain().focus().toggleSubscript().run(), !!editor?.isActive("subscript"), "Subscript")}
      {item("x²", (editor) => editor.chain().focus().toggleSuperscript().run(), !!editor?.isActive("superscript"), "Superscript")}
      <button type="button" title="Link" aria-label="Link" aria-pressed={!!editor?.isActive("link")} onClick={onLink}>Link</button>
      <button type="button" title="Image" aria-label="Image" onClick={onImage}>Image</button>
      {item("Table", (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), false, "Table")}
      <span className="split" />
      {colors.map((color) => (
        <button key={color} className="swatch" style={{ background: color }} type="button" aria-label={`Ink ${color}`} onClick={() => editor?.chain().focus().setColor(color).run()} />
      ))}
      {marks.map((color) => (
        <button key={color} className="swatch" style={{ background: color }} type="button" aria-label={`Highlight ${color}`} onClick={() => editor?.chain().focus().toggleHighlight({ color }).run()} />
      ))}
      {item("↺", (editor) => editor.chain().focus().undo().run(), false, "Undo")}
      {item("↻", (editor) => editor.chain().focus().redo().run(), false, "Redo")}
    </div>
  );
}
