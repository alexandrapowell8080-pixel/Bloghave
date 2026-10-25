import fs from "fs";
import path from "path";
import { hashPassword, timingSafeString } from "./auth";
import { DeskError } from "./errors";
import { sanitizeContent } from "./sanitize";
import { countWords, isSystemId, outlineFromHtml, readingMinutes, slugify } from "./text";
import type {
  AuthorMemory,
  Byline,
  Card,
  DeskSnapshot,
  Delivery,
  Kind,
  PairingCode,
  Post,
  PostStatus,
  PublicSettings,
  Settings,
  Site,
} from "./types";

type DB = {
  settings: Settings;
  posts: Post[];
  sites: Site[];
  deliveries: Delivery[];
  pairingCodes: PairingCode[];
  authors: AuthorMemory[];
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "bloghave.json");

function emptyByline(): Byline {
  return { name: "", role: "", email: "", bio: "", avatarUrl: "" };
}

function makePost(partial: Partial<Post> & Pick<Post, "kind" | "title" | "slug" | "section" | "contentHtml" | "excerpt" | "author">): Post {
  const now = new Date().toISOString();
  const contentHtml = partial.contentHtml;
  const wordCount = partial.wordCount ?? countWords(contentHtml);
  return {
    id: partial.id || crypto.randomUUID(),
    kind: partial.kind,
    title: partial.title,
    slug: partial.slug,
    excerpt: partial.excerpt,
    section: partial.section,
    contentHtml,
    contentJson: partial.contentJson ?? null,
    coverImage: partial.coverImage || "",
    coverCaption: partial.coverCaption || "",
    tags: partial.tags || [],
    author: partial.author,
    outline: partial.outline || outlineFromHtml(contentHtml),
    status: partial.status || "published",
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    publishedAt: partial.publishedAt === undefined ? now : partial.publishedAt,
    lastPublishedAt: partial.lastPublishedAt === undefined ? partial.publishedAt || now : partial.lastPublishedAt,
    receivedAt: partial.receivedAt ?? null,
    publishedTo: partial.publishedTo || ["bloghave"],
    sourceSystemId: partial.sourceSystemId ?? null,
    sourcePostId: partial.sourcePostId ?? null,
    sourceDeskName: partial.sourceDeskName ?? null,
    readingMinutes: partial.readingMinutes ?? readingMinutes(wordCount),
    featured: partial.featured ?? false,
    wordCount,
  };
}

function seed(): DB {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const settings: Settings = {
    passwordHash: hashPassword("bloghave"),
    passwordChanged: false,
    systemId: "bloghave",
    deskName: "The house desk",
    deskLine: "Stories and questions, sent intact.",
  };
  const imani: Byline = {
    name: "Imani Okoye",
    role: "Desk editor",
    email: "imani@bloghave.desk",
    bio: "Keeps the manuscript and the delivery in the same key.",
    avatarUrl: "",
  };
  const jules: Byline = {
    name: "Jules Hart",
    role: "Relay",
    email: "jules@bloghave.desk",
    bio: "Links one desk to the next and checks that the page still matches.",
    avatarUrl: "",
  };
  const story = makePost({
    kind: "article",
    title: "The page should arrive wearing the same clothes",
    slug: "the-page-should-arrive-wearing-the-same-clothes",
    section: "Field notes",
    excerpt: "A headline, a figure, a byline, and two stamps of time. Send them together, or you have not sent the piece.",
    author: imani,
    tags: ["desk", "delivery"],
    featured: true,
    createdAt: new Date(now - 26 * hour).toISOString(),
    publishedAt: new Date(now - 20 * hour).toISOString(),
    lastPublishedAt: new Date(now - 20 * hour).toISOString(),
    contentHtml: `
<p>A story is a set of decisions. The headline. The figure. The pause between two sentences. The name signed underneath. Bloghave treats those decisions as the piece itself.</p>
<p>When you send it, the other desk receives the same decisions. The type stays type. The picture stays where you put it. Nothing is flattened on the way out the door.</p>
<h2>What stays put</h2>
<p>The manuscript on this desk is the manuscript they render. A heading stays a heading. A quote stays a quote. A list stays a list, and a table does not turn into a paragraph of apologies.</p>
<ul>
<li>The figure you placed, with its caption</li>
<li>The byline you signed, including the role and the short life note</li>
<li>The hour the desk created it, and the hour it was sent</li>
</ul>
<blockquote>If the page has to be explained after it arrives, it did not arrive.</blockquote>
<h2>Two shapes</h2>
<p>An article is a long walk. A question is a door. They are edited differently here, and they are filed differently there. Choosing FAQ does not borrow the costume of a feature.</p>
<h3>On the far side</h3>
<p>The receiving desk keeps the shape you chose. Pick the system id, send, and that desk — not a neighbouring one — is where the piece goes.</p>
`.trim(),
  });
  const byline = makePost({
    kind: "article",
    title: "A byline is part of the piece",
    slug: "a-byline-is-part-of-the-piece",
    section: "The desk",
    excerpt: "The writer’s name is not a footer extra. It travels with the story, the way the date does.",
    author: imani,
    tags: ["byline"],
    createdAt: new Date(now - 12 * hour).toISOString(),
    publishedAt: new Date(now - 10 * hour).toISOString(),
    lastPublishedAt: new Date(now - 10 * hour).toISOString(),
    contentHtml: `
<p>Someone will read this on another site and want to know who set the sentences down. Leave the name, the role, and a line about the writer in the inspector. That block is part of the page, not an afterthought in a database.</p>
<h2>What the other desk shows</h2>
<p>Name, role, and the short bio render under the deck. If you add a portrait, it goes too. The email stays in the payload for the other system and stays off the public page.</p>
<p>Created and published are stamped by the desk. You do not type them. You can trust them because you cannot tidy them.</p>
`.trim(),
  });
  const shapes = makePost({
    kind: "article",
    title: "Questions are not articles",
    slug: "questions-are-not-articles",
    section: "Practice",
    excerpt: "FAQ is its own manuscript: a category, a question, a short answer, then the fuller one.",
    author: jules,
    tags: ["faq"],
    createdAt: new Date(now - 6 * hour).toISOString(),
    publishedAt: new Date(now - 5 * hour).toISOString(),
    lastPublishedAt: new Date(now - 5 * hour).toISOString(),
    contentHtml: `
<p>Open a question and the sheet changes. The headline becomes the question. The deck becomes the short answer. The body is the fuller reply a reader can open.</p>
<h2>Why the split matters</h2>
<p>A feature wants a figure and a long walk. A question wants a category and a door that opens onto an answer. Sending both through one anonymous template is how pages start lying.</p>
<p>On the far side, kind is part of the payload. A Bloghave desk files it accordingly. Another site can do the same, because the shape is labelled, not guessed.</p>
`.trim(),
  });
  const faqOne = makePost({
    kind: "faq",
    title: "How does a story reach another site?",
    slug: "how-does-a-story-reach-another-site",
    section: "Linking",
    excerpt: "Register the desk, keep its system id, and choose that id when you send.",
    author: jules,
    tags: ["api", "desks"],
    createdAt: new Date(now - 18 * hour).toISOString(),
    publishedAt: new Date(now - 18 * hour).toISOString(),
    lastPublishedAt: new Date(now - 18 * hour).toISOString(),
    contentHtml: `
<p>Each linked site has a system id, an ingest address, and a key. In Desks, register it — or pair with a code if the other side is Bloghave too.</p>
<h2>The moment of sending</h2>
<p>In the manuscript, choose that system id. Publish posts the piece to its ingest address with the key. The HTML, the images, the byline, and both dates go in the same envelope.</p>
<p>If you choose this desk’s own id, the story is published here. If you choose another, it goes there. You can send it again later to a second id.</p>
`.trim(),
  });
  const faqTwo = makePost({
    kind: "faq",
    title: "What travels with the piece?",
    slug: "what-travels-with-the-piece",
    section: "Delivery",
    excerpt: "The edited page: type, pictures, outline, writer, and the stamps of time.",
    author: jules,
    tags: ["payload"],
    createdAt: new Date(now - 16 * hour).toISOString(),
    publishedAt: new Date(now - 16 * hour).toISOString(),
    lastPublishedAt: new Date(now - 16 * hour).toISOString(),
    contentHtml: `
<p>The envelope is <code>bloghave.v1</code>. It carries the kind (article or FAQ), title, deck, HTML, outline, tags, cover, and every inline image as bytes so the other desk can keep its own copies.</p>
<h2>The writer and the clock</h2>
<ul>
<li>Author name, role, bio, and portrait</li>
<li>Created time, set when the manuscript was opened</li>
<li>Published time, set when you send</li>
</ul>
<p>The other desk is meant to render that HTML with the same care. This one does.</p>
`.trim(),
  });
  const faqThree = makePost({
    kind: "faq",
    title: "Can the other site send stories back?",
    slug: "can-the-other-site-send-stories-back",
    section: "Linking",
    excerpt: "Yes. Give them your ingest address and the inbound key, or pair the two desks.",
    author: imani,
    tags: ["api"],
    createdAt: new Date(now - 8 * hour).toISOString(),
    publishedAt: new Date(now - 8 * hour).toISOString(),
    lastPublishedAt: new Date(now - 8 * hour).toISOString(),
    contentHtml: `
<p>Linking is two directions. You can push to their ingest, and they can push to yours. A pairing code does both at once when the other desk runs Bloghave.</p>
<h2>What arrives here</h2>
<p>An inbound story is stored as it was sent and filed by its kind. Articles join the stories. Questions join the FAQ. The byline and the original dates stay as the writer left them.</p>
<p>You will see “Arrived from” and their desk name on the page.</p>
`.trim(),
  });

  return {
    settings,
    posts: [story, byline, shapes, faqOne, faqTwo, faqThree],
    sites: [],
    deliveries: [],
    pairingCodes: [],
    authors: [
      { ...imani, id: crypto.randomUUID(), updatedAt: new Date(now).toISOString() },
      { ...jules, id: crypto.randomUUID(), updatedAt: new Date(now).toISOString() },
    ],
  };
}

function write(db: DB) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function read(): DB {
  try {
    if (!fs.existsSync(dbPath)) {
      const db = seed();
      write(db);
      return db;
    }
    return JSON.parse(fs.readFileSync(dbPath, "utf8")) as DB;
  } catch (error) {
    throw new DeskError("The desk file could not be read.", 500);
  }
}

function update<T>(fn: (db: DB) => T): T {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

export function publicSettings(settings: Settings): PublicSettings {
  return {
    systemId: settings.systemId,
    deskName: settings.deskName,
    deskLine: settings.deskLine,
    passwordChanged: settings.passwordChanged,
  };
}

export function getSettings() {
  return publicSettings(read().settings);
}

export function getPasswordHash() {
  return read().settings.passwordHash;
}

export function toCard(post: Post): Card {
  return {
    id: post.id,
    kind: post.kind,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    section: post.section,
    coverImage: post.coverImage,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    readingMinutes: post.readingMinutes,
    featured: post.featured,
    status: post.status,
    sourceDeskName: post.sourceDeskName,
    publishedTo: post.publishedTo,
    wordCount: post.wordCount,
  };
}

export function isPublic(post: Post, systemId: string) {
  if (post.status === "received") return true;
  return post.status === "published" && post.publishedTo.includes(systemId);
}

export function listPublicPosts(kind?: Kind) {
  const db = read();
  return db.posts
    .filter((post) => isPublic(post, db.settings.systemId) && (!kind || post.kind === kind))
    .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt))
    .map((post) => structuredClone(post));
}

export function listCards(filter?: { kind?: Kind; publicOnly?: boolean }) {
  const db = read();
  return db.posts
    .filter((post) => (filter?.kind ? post.kind === filter.kind : true))
    .filter((post) => (filter?.publicOnly ? isPublic(post, db.settings.systemId) : true))
    .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt))
    .map(toCard);
}

export function getPost(id: string) {
  const post = read().posts.find((item) => item.id === id);
  return post ? structuredClone(post) : null;
}

export function getPostBySlug(slug: string, kind?: Kind) {
  const db = read();
  const post = db.posts.find((item) => item.slug === slug && (!kind || item.kind === kind) && isPublic(item, db.settings.systemId));
  return post ? structuredClone(post) : null;
}

function uniqueSlug(db: DB, slug: string, ignoreId?: string) {
  const base = slugify(slug);
  let next = base;
  let n = 2;
  while (db.posts.some((post) => post.slug === next && post.id !== ignoreId)) {
    next = `${base}-${n}`;
    n += 1;
  }
  return next;
}

function cleanAuthor(input: Partial<Byline> | undefined): Byline {
  return {
    name: String(input?.name || "").trim().slice(0, 80),
    role: String(input?.role || "").trim().slice(0, 80),
    email: String(input?.email || "").trim().slice(0, 120),
    bio: String(input?.bio || "").trim().slice(0, 400),
    avatarUrl: String(input?.avatarUrl || "").trim().slice(0, 400),
  };
}

function normalisePost(current: Post, patch: Partial<Post>): Post {
  const title = String(patch.title ?? current.title).trim().slice(0, 180);
  const contentHtml = sanitizeContent(String(patch.contentHtml ?? current.contentHtml)).slice(0, 500_000);
  const wordCount = countWords(contentHtml);
  const tags = (patch.tags ?? current.tags)
    .map((tag) => String(tag).trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 12);
  return {
    ...current,
    kind: patch.kind === "faq" || patch.kind === "article" ? patch.kind : current.kind,
    title,
    excerpt: String(patch.excerpt ?? current.excerpt).trim().slice(0, 400),
    section: String(patch.section ?? current.section).trim().slice(0, 60),
    contentHtml,
    contentJson: patch.contentJson === undefined ? current.contentJson : patch.contentJson,
    coverImage: String(patch.coverImage ?? current.coverImage).trim().slice(0, 400),
    coverCaption: String(patch.coverCaption ?? current.coverCaption).trim().slice(0, 180),
    tags,
    author: patch.author ? cleanAuthor(patch.author) : current.author,
    outline: outlineFromHtml(contentHtml),
    featured: typeof patch.featured === "boolean" ? patch.featured : current.featured,
    wordCount,
    readingMinutes: readingMinutes(wordCount),
    updatedAt: new Date().toISOString(),
  };
}

export function createPost(kind: Kind) {
  return update((db) => {
    const now = new Date().toISOString();
    const base = kind === "faq" ? "new-question" : "new-story";
    const post: Post = {
      id: crypto.randomUUID(),
      kind,
      title: "",
      slug: uniqueSlug(db, base),
      excerpt: "",
      section: "",
      contentHtml: "<p></p>",
      contentJson: null,
      coverImage: "",
      coverCaption: "",
      tags: [],
      author: emptyByline(),
      outline: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      lastPublishedAt: null,
      receivedAt: null,
      publishedTo: [],
      sourceSystemId: null,
      sourcePostId: null,
      sourceDeskName: null,
      readingMinutes: 0,
      featured: false,
      wordCount: 0,
    };
    db.posts.unshift(post);
    return structuredClone(post);
  });
}

export function savePost(id: string, patch: Partial<Post>, slugEdited: boolean) {
  return update((db) => {
    const index = db.posts.findIndex((post) => post.id === id);
    if (index < 0) throw new DeskError("That piece is not on this desk.", 404);
    const next = normalisePost(db.posts[index], patch);
    const requested = String(patch.slug || "").trim();
    if (slugEdited && requested) next.slug = uniqueSlug(db, requested, id);
    else if (!db.posts[index].title && next.title) next.slug = uniqueSlug(db, slugify(next.title), id);
    db.posts[index] = next;
    return structuredClone(next);
  });
}

export function deletePost(id: string) {
  update((db) => {
    const before = db.posts.length;
    db.posts = db.posts.filter((post) => post.id !== id);
    if (db.posts.length === before) throw new DeskError("That piece is not on this desk.", 404);
  });
}

export function listAuthors() {
  return structuredClone(read().authors);
}

export function rememberAuthor(author: Byline) {
  if (!author.name) return;
  update((db) => {
    const existing = db.authors.find((item) => item.name.toLowerCase() === author.name.toLowerCase() && item.email === author.email);
    if (existing) {
      Object.assign(existing, author, { updatedAt: new Date().toISOString() });
    } else {
      db.authors.unshift({ ...author, id: crypto.randomUUID(), updatedAt: new Date().toISOString() });
    }
    db.authors = db.authors.slice(0, 40);
  });
}

export function listSites() {
  return structuredClone(read().sites);
}

export function getSite(id: string) {
  const site = read().sites.find((item) => item.id === id);
  return site ? structuredClone(site) : null;
}

export function getSiteBySystemId(systemId: string) {
  const site = read().sites.find((item) => item.systemId === systemId);
  return site ? structuredClone(site) : null;
}

export function findSiteByInboundKey(key: string) {
  if (!key) return null;
  const site = read().sites.find((item) => item.active && timingSafeString(item.inboundKey, key));
  return site ? structuredClone(site) : null;
}

export function createSite(input: {
  systemId: string;
  name: string;
  ingestUrl: string;
  outboundKey: string;
  inboundKey: string;
  hmacSecret: string;
  requireSignature: boolean;
  notes: string;
}) {
  return update((db) => {
    const systemId = input.systemId.trim().toLowerCase();
    if (!isSystemId(systemId)) throw new DeskError("Use a system id of lowercase letters, numbers, and hyphens.", 400);
    if (systemId === db.settings.systemId) throw new DeskError("That id belongs to this desk.", 400);
    if (db.sites.some((site) => site.systemId === systemId)) throw new DeskError("A desk with that system id is already linked.", 400);
    let ingestUrl = input.ingestUrl.trim();
    if (ingestUrl && !/^https?:\/\//i.test(ingestUrl)) throw new DeskError("The ingest address must start with http:// or https://.", 400);
    const site: Site = {
      id: crypto.randomUUID(),
      systemId,
      name: input.name.trim().slice(0, 80) || systemId,
      ingestUrl,
      outboundKey: input.outboundKey.trim(),
      inboundKey: input.inboundKey.trim(),
      hmacSecret: input.hmacSecret.trim(),
      requireSignature: input.requireSignature,
      notes: input.notes.trim().slice(0, 400),
      active: true,
      createdAt: new Date().toISOString(),
      lastTestedAt: null,
      lastTestOk: null,
      lastTestMessage: "",
    };
    db.sites.unshift(site);
    return structuredClone(site);
  });
}

export function patchSite(id: string, patch: Partial<Site>) {
  return update((db) => {
    const site = db.sites.find((item) => item.id === id);
    if (!site) throw new DeskError("That linked desk is gone.", 404);
    if (typeof patch.name === "string") site.name = patch.name.trim().slice(0, 80) || site.name;
    if (typeof patch.ingestUrl === "string") {
      const ingestUrl = patch.ingestUrl.trim();
      if (ingestUrl && !/^https?:\/\//i.test(ingestUrl)) throw new DeskError("The ingest address must start with http:// or https://.", 400);
      site.ingestUrl = ingestUrl;
    }
    if (typeof patch.outboundKey === "string") site.outboundKey = patch.outboundKey.trim();
    if (typeof patch.notes === "string") site.notes = patch.notes.trim().slice(0, 400);
    if (typeof patch.requireSignature === "boolean") site.requireSignature = patch.requireSignature;
    if (typeof patch.hmacSecret === "string") site.hmacSecret = patch.hmacSecret.trim();
    if (typeof patch.active === "boolean") site.active = patch.active;
    if (typeof patch.lastTestedAt === "string" || patch.lastTestedAt === null) site.lastTestedAt = patch.lastTestedAt;
    if (typeof patch.lastTestOk === "boolean" || patch.lastTestOk === null) site.lastTestOk = patch.lastTestOk;
    if (typeof patch.lastTestMessage === "string") site.lastTestMessage = patch.lastTestMessage.slice(0, 400);
    return structuredClone(site);
  });
}

export function removeSite(id: string) {
  update((db) => {
    const before = db.sites.length;
    db.sites = db.sites.filter((site) => site.id !== id);
    if (db.sites.length === before) throw new DeskError("That linked desk is gone.", 404);
  });
}

export function recordDelivery(entry: Omit<Delivery, "id" | "createdAt">) {
  update((db) => {
    db.deliveries.unshift({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    db.deliveries = db.deliveries.slice(0, 300);
  });
}

export function listDeliveries() {
  return structuredClone(read().deliveries);
}

function touchPublished(post: Post, systemIds: string[], retract: boolean) {
  const unique = [...new Set(systemIds)];
  if (retract) {
    post.publishedTo = post.publishedTo.filter((id) => !unique.includes(id));
    if (post.status !== "received" && post.publishedTo.length === 0) post.status = "draft";
    return;
  }
  for (const id of unique) if (!post.publishedTo.includes(id)) post.publishedTo.push(id);
  const now = new Date().toISOString();
  if (!post.publishedAt) post.publishedAt = now;
  post.lastPublishedAt = now;
  if (post.status !== "received") post.status = "published";
}

export function preparePiece(id: string, patch: Partial<Post>, slugEdited: boolean, publishing: boolean) {
  return update((db) => {
    const index = db.posts.findIndex((post) => post.id === id);
    if (index < 0) throw new DeskError("That piece is not on this desk.", 404);
    const next = normalisePost(db.posts[index], patch);
    const requested = String(patch.slug || "").trim();
    if (slugEdited && requested) next.slug = uniqueSlug(db, requested, id);
    else if (publishing && !next.title) throw new DeskError("Give the piece a headline before you send it.", 400);
    else if (!db.posts[index].title && next.title) next.slug = uniqueSlug(db, slugify(next.title), id);
    if (publishing) {
      if (!next.title) throw new DeskError("Give the piece a headline before you send it.", 400);
      if (!next.author.name) throw new DeskError("Sign it with the writer’s name before you send it.", 400);
      if (!plainEnough(next.contentHtml)) {
        throw new DeskError(next.kind === "faq" ? "Write the answer before you send it." : "Write the body before you send it.", 400);
      }
      if (next.kind === "faq" && !next.section) throw new DeskError("Give the question a category before you send it.", 400);
      const author = next.author;
      const existing = db.authors.find((item) => item.name.toLowerCase() === author.name.toLowerCase());
      if (existing) Object.assign(existing, author, { updatedAt: new Date().toISOString() });
      else db.authors.unshift({ ...author, id: crypto.randomUUID(), updatedAt: new Date().toISOString() });
    }
    db.posts[index] = next;
    return structuredClone(next);
  });
}

export function commitTargets(id: string, systemIds: string[], retract: boolean) {
  return update((db) => {
    const post = db.posts.find((item) => item.id === id);
    if (!post) throw new DeskError("That piece is not on this desk.", 404);
    touchPublished(post, systemIds, retract);
    return structuredClone(post);
  });
}

function plainEnough(html: string) {
  return countWords(html) > 0;
}

export function postsForSystem(systemId: string) {
  const db = read();
  return db.posts.filter((post) => post.publishedTo.includes(systemId) && post.status === "published").map((post) => structuredClone(post));
}

export function upsertReceived(input: {
  originSystemId: string;
  originDeskName: string;
  entryId: string;
  kind: Kind;
  title: string;
  slug: string;
  excerpt: string;
  section: string;
  contentHtml: string;
  coverImage: string;
  coverCaption: string;
  tags: string[];
  author: Byline;
  createdAt: string;
  publishedAt: string;
  featured: boolean;
}) {
  return update((db) => {
    let post = db.posts.find((item) => item.sourceSystemId === input.originSystemId && item.sourcePostId === input.entryId);
    const contentHtml = sanitizeContent(input.contentHtml);
    const wordCount = countWords(contentHtml);
    if (!post) {
      post = {
        id: crypto.randomUUID(),
        kind: input.kind,
        title: "",
        slug: uniqueSlug(db, input.slug || input.title || "arrived"),
        excerpt: "",
        section: "",
        contentHtml: "",
        contentJson: null,
        coverImage: "",
        coverCaption: "",
        tags: [],
        author: emptyByline(),
        outline: [],
        status: "received",
        createdAt: input.createdAt,
        updatedAt: new Date().toISOString(),
        publishedAt: input.publishedAt,
        lastPublishedAt: input.publishedAt,
        receivedAt: new Date().toISOString(),
        publishedTo: [],
        sourceSystemId: input.originSystemId,
        sourcePostId: input.entryId,
        sourceDeskName: input.originDeskName,
        readingMinutes: readingMinutes(wordCount),
        featured: false,
        wordCount,
      };
      db.posts.unshift(post);
    }
    post.kind = input.kind;
    post.title = input.title.slice(0, 180);
    post.excerpt = input.excerpt.slice(0, 400);
    post.section = input.section.slice(0, 60);
    post.contentHtml = contentHtml;
    post.coverImage = input.coverImage;
    post.coverCaption = input.coverCaption.slice(0, 180);
    post.tags = input.tags.slice(0, 12);
    post.author = cleanAuthor(input.author);
    post.outline = outlineFromHtml(contentHtml);
    post.wordCount = wordCount;
    post.readingMinutes = readingMinutes(wordCount);
    post.featured = input.featured;
    post.createdAt = input.createdAt || post.createdAt;
    post.publishedAt = input.publishedAt || post.publishedAt;
    post.updatedAt = new Date().toISOString();
    post.status = "received";
    post.sourceDeskName = input.originDeskName || post.sourceDeskName;
    if (!post.slug) post.slug = uniqueSlug(db, input.slug || input.title, post.id);
    return structuredClone(post);
  });
}

export function retractReceived(originSystemId: string, entryId: string) {
  let found = false;
  update((db) => {
    const post = db.posts.find((item) => item.sourceSystemId === originSystemId && item.sourcePostId === entryId);
    if (!post) return;
    post.status = "retracted";
    post.updatedAt = new Date().toISOString();
    found = true;
  });
  return found;
}

export function updateIdentity(input: { systemId?: string; deskName?: string; deskLine?: string }) {
  update((db) => {
    if (input.systemId) {
      const systemId = input.systemId.trim().toLowerCase();
      if (!isSystemId(systemId)) throw new DeskError("Use a system id of lowercase letters, numbers, and hyphens.", 400);
      if (db.sites.some((site) => site.systemId === systemId)) throw new DeskError("A linked desk already uses that system id.", 400);
      const previous = db.settings.systemId;
      if (previous !== systemId) {
        for (const post of db.posts) {
          post.publishedTo = post.publishedTo.map((id) => (id === previous ? systemId : id));
        }
        db.settings.systemId = systemId;
      }
    }
    if (typeof input.deskName === "string" && input.deskName.trim()) db.settings.deskName = input.deskName.trim().slice(0, 80);
    if (typeof input.deskLine === "string") db.settings.deskLine = input.deskLine.trim().slice(0, 140);
  });
  return getSettings();
}

export function changePassword(nextHash: string) {
  update((db) => {
    db.settings.passwordHash = nextHash;
    db.settings.passwordChanged = true;
  });
}

export function createPairingCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BH-";
  for (let i = 0; i < 8; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  const createdAt = new Date();
  const row: PairingCode = {
    code,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24).toISOString(),
    usedAt: null,
    usedBy: null,
  };
  update((db) => {
    db.pairingCodes = [row, ...db.pairingCodes.filter((item) => item.usedAt || new Date(item.expiresAt).getTime() > Date.now())].slice(0, 20);
  });
  return row;
}

export function consumePairingCode(code: string, usedBy: string) {
  let ok = false;
  update((db) => {
    const row = db.pairingCodes.find((item) => item.code.toLowerCase() === code.trim().toLowerCase());
    if (!row) throw new DeskError("That pairing code is not on this desk.", 404);
    if (row.usedAt) throw new DeskError("That pairing code has already been used.", 400);
    if (new Date(row.expiresAt).getTime() < Date.now()) throw new DeskError("That pairing code has expired.", 400);
    row.usedAt = new Date().toISOString();
    row.usedBy = usedBy.slice(0, 80);
    ok = true;
  });
  return ok;
}

export function snapshot(): DeskSnapshot {
  const db = read();
  return {
    settings: publicSettings(db.settings),
    sites: structuredClone(db.sites),
    deliveries: structuredClone(db.deliveries).slice(0, 40),
    pairingCodes: structuredClone(db.pairingCodes).slice(0, 8),
    counts: {
      stories: db.posts.filter((post) => post.kind === "article").length,
      questions: db.posts.filter((post) => post.kind === "faq").length,
      drafts: db.posts.filter((post) => post.status === "draft").length,
    },
  };
}

export function fullSettings() {
  return structuredClone(read().settings);
}

export type { PostStatus };
