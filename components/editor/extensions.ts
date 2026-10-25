import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import { Heading } from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import { slugify } from "@/lib/text";

const HeadingWithId = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];
    return [`h${level}`, { ...HTMLAttributes, id: slugify(node.textContent || "section") }, 0];
  },
});

export function createExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: false,
      link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow" } },
    }),
    HeadingWithId.configure({ levels: [2, 3, 4] }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Subscript,
    Superscript,
    Typography,
    Placeholder.configure({ placeholder }),
    CharacterCount,
    Image.configure({
      allowBase64: false,
      HTMLAttributes: { class: "story-img" },
      resize: { enabled: true, directions: ["left", "right"], minWidth: 120, alwaysPreserveAspectRatio: true },
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
  ];
}
