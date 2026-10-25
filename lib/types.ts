export type Kind = "article" | "faq";

export type Byline = {
  name: string;
  role: string;
  email: string;
  bio: string;
  avatarUrl: string;
};

export type OutlineItem = {
  id: string;
  level: number;
  text: string;
};

export type PostStatus = "draft" | "published" | "received" | "retracted";

export type Post = {
  id: string;
  kind: Kind;
  title: string;
  slug: string;
  excerpt: string;
  section: string;
  contentHtml: string;
  contentJson: unknown;
  coverImage: string;
  coverCaption: string;
  tags: string[];
  author: Byline;
  outline: OutlineItem[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  lastPublishedAt: string | null;
  receivedAt: string | null;
  publishedTo: string[];
  sourceSystemId: string | null;
  sourcePostId: string | null;
  sourceDeskName: string | null;
  readingMinutes: number;
  featured: boolean;
  wordCount: number;
};

export type Site = {
  id: string;
  systemId: string;
  name: string;
  ingestUrl: string;
  outboundKey: string;
  inboundKey: string;
  hmacSecret: string;
  requireSignature: boolean;
  notes: string;
  active: boolean;
  createdAt: string;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string;
};

export type Delivery = {
  id: string;
  postId: string;
  postTitle: string;
  systemId: string;
  siteName: string;
  action: "publish" | "retract" | "ping";
  ok: boolean;
  statusCode: number | null;
  message: string;
  createdAt: string;
};

export type PairingCode = {
  code: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
};

export type Settings = {
  passwordHash: string;
  passwordChanged: boolean;
  systemId: string;
  deskName: string;
  deskLine: string;
};

export type AuthorMemory = Byline & {
  id: string;
  updatedAt: string;
};

export type PublicSettings = {
  systemId: string;
  deskName: string;
  deskLine: string;
  passwordChanged: boolean;
};

export type Card = {
  id: string;
  kind: Kind;
  title: string;
  slug: string;
  excerpt: string;
  section: string;
  coverImage: string;
  tags: string[];
  author: Byline;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
  featured: boolean;
  status: PostStatus;
  sourceDeskName: string | null;
  publishedTo: string[];
  wordCount: number;
};

export type Asset = {
  sourceUrl: string;
  filename: string;
  mime: string;
  dataBase64: string;
};

export type Entry = {
  id: string;
  kind: Kind;
  title: string;
  slug: string;
  excerpt: string;
  section: string;
  contentHtml: string;
  contentText: string;
  coverImage: string | null;
  coverCaption: string;
  tags: string[];
  author: Byline;
  outline: OutlineItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  readingMinutes: number;
  wordCount: number;
  featured: boolean;
};

export type Envelope = {
  spec: "bloghave.v1";
  type: "entry" | "retract" | "ping";
  originSystemId: string;
  originDeskName: string;
  targetSystemId: string;
  sentAt: string;
  entry?: Entry;
  entryId?: string;
  assets?: Asset[];
};

export type DeskSnapshot = {
  settings: PublicSettings;
  sites: Site[];
  deliveries: Delivery[];
  pairingCodes: PairingCode[];
  counts: { stories: number; questions: number; drafts: number };
};
