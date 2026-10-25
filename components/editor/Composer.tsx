"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { StoryHead } from "@/components/StoryHead";
import { TagRow } from "@/components/Cards";
import type { AuthorMemory, Byline, Kind, Post } from "@/lib/types";
import { countWords, outlineFromJson, readingMinutes } from "@/lib/text";
import { createExtensions } from "./extensions";
import { Toolbar } from "./Toolbar";

type SiteOption = { id: string; systemId: string; name: string; ingestUrl: string; active: boolean };
type Receipt = { ok: boolean; message: string; systemId: string; name: string };

async function uploadFile(file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || "The picture could not be uploaded.");
  return data.url;
}

export function Composer({
  post,
  sites,
  settings,
  authors,
}: {
  post: Post;
  sites: SiteOption[];
  settings: { systemId: string; deskName: string };
  authors: AuthorMemory[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(post);
  const draftRef = useRef(post);
  const editorRef = useRef<Editor | null>(null);
  const rev = useRef(0);
  const slugEdited = useRef(false);
  const dirty = useRef(false);
  const [status, setStatus] = useState("Saved");
  const [reading, setReading] = useState(false);
  const [targets, setTargets] = useState<string[]>(post.publishedTo.length ? post.publishedTo : [settings.systemId]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Receipt[] | null>(null);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [words, setWords] = useState(post.wordCount);
  const fileRef = useRef<HTMLInputElement>(null);
  const placeholder = post.kind === "faq" ? "Write the fuller answer…" : "Write the piece…";

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: createExtensions(placeholder),
    content: post.contentHtml || "<p></p>",
    editorProps: {
      attributes: { class: "manuscript-body", spellcheck: "true" },
      handlePaste(_view, event) {
        const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        void insertImages(editorRef.current, files);
        return true;
      },
      handleDrop(_view, event) {
        const files = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        void insertImages(editorRef.current, files);
        return true;
      },
    },
    onCreate: ({ editor: current }) => {
      editorRef.current = current;
      setWords(current.storage.characterCount.words());
    },
    onUpdate: ({ editor: current }) => {
      editorRef.current = current;
      const count = current.storage.characterCount.words();
      const next = {
        ...draftRef.current,
        contentHtml: current.getHTML(),
        contentJson: current.getJSON(),
        outline: outlineFromJson(current.getJSON()),
        wordCount: count,
        readingMinutes: readingMinutes(count),
      };
      draftRef.current = next;
      setDraft(next);
      setWords(count);
      markDirty();
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    editor?.setEditable(!reading);
  }, [editor, reading]);

  function markDirty() {
    rev.current += 1;
    dirty.current = true;
    setStatus("Unsaved");
  }

  function update(patch: Partial<Post>) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    markDirty();
  }

  function snapshot(): Post {
    const current = editorRef.current;
    const contentHtml = current?.getHTML() || draftRef.current.contentHtml;
    const contentJson = current?.getJSON() || draftRef.current.contentJson;
    const wordCount = current ? current.storage.characterCount.words() : countWords(contentHtml);
    const next = {
      ...draftRef.current,
      contentHtml,
      contentJson,
      outline: outlineFromJson(contentJson),
      wordCount,
      readingMinutes: readingMinutes(wordCount),
    };
    draftRef.current = next;
    return next;
  }

  async function save(leave = false) {
    const seen = rev.current;
    const body = snapshot();
    setStatus("Saving…");
    setError("");
    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post: body, slugEdited: slugEdited.current }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; post?: Post };
    if (response.status === 401) {
      location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
      return;
    }
    if (!response.ok || !data.post) {
      setStatus("Couldn’t save");
      setError(data.error || "The draft could not be saved.");
      return;
    }
    if (rev.current === seen || leave) {
      dirty.current = false;
      setStatus("Saved");
    }
    draftRef.current = { ...draftRef.current, updatedAt: data.post.updatedAt, slug: data.post.slug };
    setDraft(draftRef.current);
    if (leave) router.push("/desk");
  }

  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => { void save(); }, 900);
    return () => clearTimeout(timer);
  }, [draft, words]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  async function insertImages(current: Editor | null, files: File[]) {
    if (!current) return;
    for (const file of files) {
      try {
        const url = await uploadFile(file);
        current.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The picture could not be uploaded.");
      }
    }
    markDirty();
  }

  async function publish(retract = false) {
    setPublishing(true);
    setError("");
    setResults(null);
    const body = snapshot();
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post: body, slugEdited: slugEdited.current, systemIds: targets, retract }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; post?: Post; results?: Receipt[]; publicPath?: string | null };
    setPublishing(false);
    if (!response.ok || !data.post) {
      setError(data.error || "The piece could not be sent.");
      return;
    }
    draftRef.current = data.post;
    setDraft(data.post);
    dirty.current = false;
    rev.current += 1;
    setStatus("Saved");
    const results = data.results || [];
    const sent = !retract && results.length > 0 && results.every((item) => item.ok);
    if (sent) {
      router.push("/desk");
      return;
    }
    setResults(results);
    setPublicPath(data.publicPath || null);
  }

  const minutes = readingMinutes(words);
  const desks = useMemo(
    () => [{ id: "local", systemId: settings.systemId, name: `${settings.deskName} · this desk`, ingestUrl: "", active: true }, ...sites],
    [settings.deskName, settings.systemId, sites],
  );

  return (
    <div>
      <div className="composer-top">
        <div>
          <Link href="/desk" style={{ color: "#c9bfb2", textDecoration: "none" }}>Library</Link>
          <div className="save-state">{status}{draft.slug ? ` · /${draft.kind === "faq" ? "faq" : "blog"}/${draft.slug}` : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-tiny" type="button" onClick={() => setReading((value) => !value)}>
            {reading ? "Back to editing" : "Reading view"}
          </button>
          <button className="btn btn-ghost btn-tiny" type="button" onClick={() => void save(true)}>Save draft</button>
          <button className="btn btn-primary btn-tiny" type="button" disabled={publishing} onClick={() => void publish(false)}>
            {publishing ? "Sending…" : "Publish"}
          </button>
        </div>
      </div>
      <div className={`composer ${reading ? "is-reading" : ""}`}>
        <aside className="outline">
          <h2>Outline</h2>
          {draft.outline.length ? draft.outline.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              className={`l${item.level}`}
              type="button"
              onClick={() => {
                const current = editorRef.current;
                if (!current) return;
                let found = 0;
                current.state.doc.descendants((node, pos) => {
                  if (node.type.name !== "heading") return;
                  if (found === index) {
                    const dom = current.view.nodeDOM(pos);
                    if (dom instanceof HTMLElement) dom.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                  found += 1;
                });
              }}
            >
              {item.text}
            </button>
          )) : <p className="fine">Headings you add will gather here.</p>}
        </aside>
        <div>
          <Toolbar editor={editor} onImage={() => fileRef.current?.click()} onLink={() => {
            setLinkUrl(editor?.getAttributes("link").href || "https://");
            setLinkOpen((value) => !value);
          }} />
          {linkOpen ? (
            <form className="link-pop" onSubmit={(event) => {
              event.preventDefault();
              if (!editor) return;
              if (!linkUrl.trim()) editor.chain().focus().unsetLink().run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
              setLinkOpen(false);
            }}>
              <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" aria-label="Link address" />
              <button className="btn btn-primary btn-tiny" type="submit">Place</button>
              <button className="btn btn-ghost btn-tiny" type="button" onClick={() => { editor?.chain().focus().unsetLink().run(); setLinkOpen(false); }}>Remove</button>
            </form>
          ) : null}
          <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
            const files = [...(event.target.files || [])];
            if (files.length) void insertImages(editor, files);
            event.target.value = "";
          }} />
          <div className="sheet" id="manuscript">
            <StoryHead
              editable={!reading}
              kind={draft.kind}
              section={draft.section}
              title={draft.title}
              excerpt={draft.excerpt}
              coverImage={draft.coverImage}
              coverCaption={draft.coverCaption}
              author={draft.author}
              createdAt={draft.createdAt}
              publishedAt={draft.publishedAt}
              readingMinutes={minutes}
              sourceDeskName={draft.sourceDeskName}
              onSection={(section) => update({ section })}
              onTitle={(title) => update({ title })}
              onExcerpt={(excerpt) => update({ excerpt })}
              onCoverCaption={(coverCaption) => update({ coverCaption })}
              onCoverClear={() => update({ coverImage: "", coverCaption: "" })}
              onCoverFile={(file) => {
                void uploadFile(file).then((coverImage) => update({ coverImage })).catch((caught) => setError(caught instanceof Error ? caught.message : "The picture could not be uploaded."));
              }}
            />
            <EditorContent editor={editor} className="prose-bh" />
            {reading ? <TagRow tags={draft.tags} kind={draft.kind} /> : (
              <label className="field" style={{ marginTop: 18 }}>
                <span>Tags</span>
                <input value={draft.tags.join(", ")} onChange={(event) => update({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="desk, delivery" />
              </label>
            )}
          </div>
          <p className="fine">{words} words · {minutes ? `${minutes} min read` : "Empty page"} · Created {new Date(draft.createdAt).toLocaleString("en-GB")}</p>
          {error ? <p className="bad">{error}</p> : null}
        </div>
        <aside className="inspector">
          <h2>Send to</h2>
          <p className="fine">Choose the system id. The piece goes to that desk as edited.</p>
          {desks.filter((desk) => desk.active).map((desk) => {
            const on = targets.includes(desk.systemId);
            return (
              <label key={desk.systemId} className={`dest ${on ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setTargets((current) => on ? current.filter((id) => id !== desk.systemId) : [...current, desk.systemId])}
                />
                <span>
                  <strong>{desk.name}</strong>
                  <em>{desk.systemId}</em>
                </span>
              </label>
            );
          })}
          <h2 style={{ marginTop: 16 }}>Byline</h2>
          {authors.length ? (
            <label className="field">
              <span>Saved writers</span>
              <select value="" onChange={(event) => {
                const author = authors.find((item) => item.id === event.target.value);
                if (author) update({ author: { name: author.name, role: author.role, email: author.email, bio: author.bio, avatarUrl: author.avatarUrl } });
              }}>
                <option value="">Choose a writer</option>
                {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
              </select>
            </label>
          ) : null}
          <BylineFields author={draft.author} onChange={(author) => update({ author })} onAvatar={(file) => {
            void uploadFile(file).then((avatarUrl) => update({ author: { ...draftRef.current.author, avatarUrl } })).catch((caught) => setError(caught instanceof Error ? caught.message : "The portrait could not be uploaded."));
          }} />
          <h2 style={{ marginTop: 16 }}>Piece</h2>
          <label className="field">
            <span>Kind</span>
            <select value={draft.kind} onChange={(event) => update({ kind: event.target.value as Kind })}>
              <option value="article">Article</option>
              <option value="faq">FAQ</option>
            </select>
          </label>
          <label className="field">
            <span>Slug</span>
            <input value={draft.slug} onChange={(event) => { slugEdited.current = true; update({ slug: event.target.value }); }} />
          </label>
          <label className="field" style={{ marginTop: 8 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", textTransform: "none", letterSpacing: 0 }}>
              <input type="checkbox" checked={draft.featured} onChange={(event) => update({ featured: event.target.checked })} />
              Feature this story
            </span>
          </label>
          <p className="fine">Created {draft.createdAt ? new Date(draft.createdAt).toLocaleString("en-GB") : ""}</p>
          <p className="fine">{draft.publishedAt ? `Published ${new Date(draft.publishedAt).toLocaleString("en-GB")}` : "Not published yet. The published time is stamped when you send."}</p>
          {draft.publishedTo.length ? <p className="fine">Already with: {draft.publishedTo.join(", ")}</p> : null}
          {draft.status === "published" || draft.status === "received" ? (
            <button className="btn btn-ghost btn-tiny" type="button" disabled={publishing} onClick={() => void publish(true)}>Unpublish from selected</button>
          ) : null}
          {results ? (
            <div className={`receipt ${results.every((item) => item.ok) ? "" : "bad"}`}>
              <strong>{results.every((item) => item.ok) ? "It’s with the desks you chose." : "Some desks did not take it."}</strong>
              <ul>
                {results.map((item) => <li key={item.systemId}><b>{item.systemId}</b> — {item.message}</li>)}
              </ul>
              {publicPath ? <Link href={publicPath}>Read it on this desk</Link> : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function BylineFields({ author, onChange, onAvatar }: { author: Byline; onChange: (author: Byline) => void; onAvatar: (file: File) => void }) {
  const set = (patch: Partial<Byline>) => onChange({ ...author, ...patch });
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label className="field"><span>Name</span><input value={author.name} onChange={(event) => set({ name: event.target.value })} /></label>
      <label className="field"><span>Role</span><input value={author.role} onChange={(event) => set({ role: event.target.value })} /></label>
      <label className="field"><span>Email</span><input value={author.email} onChange={(event) => set({ email: event.target.value })} placeholder="Kept in the payload, not on the page" /></label>
      <label className="field"><span>Short bio</span><textarea value={author.bio} onChange={(event) => set({ bio: event.target.value })} /></label>
      <label className="btn btn-ghost btn-tiny">
        Portrait
        <input hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAvatar(file);
          event.target.value = "";
        }} />
      </label>
    </div>
  );
}
