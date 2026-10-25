import { Editor } from "@tiptap/core";
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

const root = document.getElementById("composer-app");
if (root) {
  const post = JSON.parse(root.dataset.post);
  const token = document.querySelector('meta[name="csrf-token"]').content;
  let slugEdited = false;
  let dirty = false;
  let timer = 0;
  let cover = post.coverImage || "";

  const $ = (id) => document.getElementById(id);
  const title = $("field-title");
  const excerpt = $("field-excerpt");
  const error = $("compose-error");
  const status = $("save-state");

  function fit(node) {
    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }
  [title, excerpt].forEach((node) => {
    fit(node);
    node.addEventListener("input", () => fit(node));
  });
  title.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });

  function slugify(input) {
    const s = input.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    return s || "section";
  }

  const HeadingWithId = Heading.extend({
    renderHTML({ node, HTMLAttributes }) {
      const level = this.options.levels.includes(node.attrs.level) ? node.attrs.level : this.options.levels[0];
      return [`h${level}`, { ...HTMLAttributes, id: slugify(node.textContent || "section") }, 0];
    },
  });

  const editor = new Editor({
    element: $("editor"),
    content: post.contentHtml || "<p></p>",
    extensions: [
      StarterKit.configure({
        heading: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      HeadingWithId.configure({ levels: [2, 3, 4] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Typography,
      Placeholder.configure({ placeholder: post.kind === "faq" ? "Write the fuller answer" : "Write the story" }),
      CharacterCount,
      Image.configure({ HTMLAttributes: { class: "story-img" } }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    onUpdate() {
      markDirty();
      paintOutline();
      paintReading();
    },
  });

  const buttons = [
    ["H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ["H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
    ["B", () => editor.chain().focus().toggleBold().run()],
    ["I", () => editor.chain().focus().toggleItalic().run()],
    ["U", () => editor.chain().focus().toggleUnderline().run()],
    ["S", () => editor.chain().focus().toggleStrike().run()],
    ["List", () => editor.chain().focus().toggleBulletList().run()],
    ["Number", () => editor.chain().focus().toggleOrderedList().run()],
    ["Tasks", () => editor.chain().focus().toggleTaskList().run()],
    ["Quote", () => editor.chain().focus().toggleBlockquote().run()],
    ["Code", () => editor.chain().focus().toggleCodeBlock().run()],
    ["Left", () => editor.chain().focus().setTextAlign("left").run()],
    ["Center", () => editor.chain().focus().setTextAlign("center").run()],
    ["Right", () => editor.chain().focus().setTextAlign("right").run()],
    ["Link", () => {
      const previous = editor.getAttributes("link").href || "";
      const href = window.prompt("Link address", previous);
      if (href === null) return;
      if (href === "") editor.chain().focus().unsetLink().run();
      else editor.chain().focus().setLink({ href }).run();
    }],
    ["Image", () => $("inline-file").click()],
    ["Table", () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
    ["Rule", () => editor.chain().focus().setHorizontalRule().run()],
    ["Undo", () => editor.chain().focus().undo().run()],
    ["Redo", () => editor.chain().focus().redo().run()],
  ];
  const bar = $("toolbar");
  buttons.forEach(([label, run]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-tiny";
    button.textContent = label;
    button.addEventListener("click", run);
    bar.appendChild(button);
  });
  const file = document.createElement("input");
  file.id = "inline-file";
  file.type = "file";
  file.accept = "image/png,image/jpeg,image/gif,image/webp";
  file.hidden = true;
  file.addEventListener("change", async () => {
    const chosen = file.files?.[0];
    file.value = "";
    if (!chosen) return;
    const url = await upload(chosen);
    if (url) editor.chain().focus().setImage({ src: url, alt: chosen.name.replace(/\.[^.]+$/, "") }).run();
  });
  bar.appendChild(file);

  function words() {
    const text = editor.getText().trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }

  function paintReading() {
    const count = words();
    $("reading").textContent = count ? `${Math.max(1, Math.round(count / 220))} min read` : "";
  }

  function paintOutline() {
    const box = $("outline");
    box.innerHTML = "";
    editor.getJSON().content?.forEach((node) => {
      if (node.type !== "heading") return;
      const text = (node.content || []).map((part) => part.text || "").join("").trim();
      if (!text) return;
      const link = document.createElement("a");
      link.href = `#${slugify(text)}`;
      link.textContent = text;
      box.appendChild(link);
    });
  }

  function paintByline() {
    const name = $("author-name").value.trim();
    $("byline-name").textContent = name || "Writer’s name";
    $("avatar-letter").textContent = (name || "?").slice(0, 1).toUpperCase();
    const note = [$("author-role").value.trim(), $("author-bio").value.trim()].filter(Boolean).join(" — ");
    $("byline-note").textContent = note || "Role and a short note";
  }

  function payload() {
    return {
      id: post.id,
      kind: post.kind,
      title: title.value,
      slug: $("field-slug").value,
      excerpt: excerpt.value,
      section: $("field-section").value,
      contentHtml: editor.getHTML(),
      contentJson: editor.getJSON(),
      coverImage: cover,
      coverCaption: $("field-caption").value,
      tags: $("field-tags").value.split(",").map((tag) => tag.trim()).filter(Boolean),
      featured: $("field-featured").checked,
      author: {
        name: $("author-name").value,
        role: $("author-role").value,
        email: $("author-email").value,
        bio: $("author-bio").value,
        avatarUrl: post.author?.avatarUrl || "",
      },
    };
  }

  async function upload(file) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", headers: { "X-CSRF-TOKEN": token, Accept: "application/json" }, body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      show(data.error || "The picture could not be uploaded.");
      return "";
    }
    return data.url || "";
  }

  function show(message) {
    error.hidden = !message;
    error.textContent = message || "";
  }

  async function save(leave = false) {
    status.textContent = "Saving…";
    show("");
    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": token },
      body: JSON.stringify({ post: payload(), slugEdited }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
      return;
    }
    if (!response.ok || !data.post) {
      status.textContent = "Couldn’t save";
      show(data.error || "The draft could not be saved.");
      return;
    }
    dirty = false;
    post.slug = data.post.slug;
    $("field-slug").value = data.post.slug;
    status.textContent = `Saved · /${post.kind === "faq" ? "faq" : "blog"}/${data.post.slug}`;
    if (leave) location.href = "/desk";
  }

  function markDirty() {
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(() => save(false), 900);
  }

  ["field-title", "field-excerpt", "field-section", "field-caption", "field-tags", "author-name", "author-role", "author-email", "author-bio"].forEach((id) => {
    $(id).addEventListener("input", () => {
      markDirty();
      if (id.startsWith("author")) paintByline();
    });
  });
  $("field-slug").addEventListener("input", () => { slugEdited = true; markDirty(); });
  $("field-featured").addEventListener("change", markDirty);

  $("save-draft").addEventListener("click", () => save(true));
  $("publish").addEventListener("click", () => send(false));
  $("unpublish").addEventListener("click", () => send(true));

  async function send(retract) {
    const targets = [...document.querySelectorAll(".target:checked")].map((node) => node.value);
    show("");
    status.textContent = retract ? "Taking down…" : "Publishing…";
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-CSRF-TOKEN": token },
      body: JSON.stringify({ post: payload(), slugEdited, systemIds: targets, retract }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.post) {
      status.textContent = "Couldn’t send";
      show(data.error || "The piece could not be sent.");
      return;
    }
    dirty = false;
    const results = data.results || [];
    if (!retract && results.length && results.every((item) => item.ok)) {
      location.href = "/desk";
      return;
    }
    status.textContent = "Saved";
    const box = $("receipts");
    box.innerHTML = results.map((item) => `<p class="${item.ok ? "ok" : "bad"}">${item.name}: ${item.message}</p>`).join("");
    if (data.publicPath) box.insertAdjacentHTML("beforeend", `<p><a href="${data.publicPath}">View the public page</a></p>`);
  }

  $("cover-file").addEventListener("change", async () => {
    const chosen = $("cover-file").files?.[0];
    $("cover-file").value = "";
    if (!chosen) return;
    const url = await upload(chosen);
    if (!url) return;
    cover = url;
    $("cover-slot").innerHTML = `<img class="cover" src="${url}" alt="">`;
    $("cover-clear").hidden = false;
    $("field-caption").hidden = false;
    markDirty();
  });
  $("cover-clear").addEventListener("click", () => {
    cover = "";
    $("cover-slot").innerHTML = "<span>Add a figure</span>";
    $("cover-clear").hidden = true;
    $("field-caption").hidden = true;
    markDirty();
  });

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      save(false);
    }
  });
  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  paintOutline();
  paintReading();
  paintByline();
}
