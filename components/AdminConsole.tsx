"use client";

import { useEffect, useState } from "react";
import type { DeskSnapshot, Site } from "@/lib/types";
import { formatStamp } from "@/lib/text";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "The desk could not do that.");
  return data;
}

export function AdminConsole({ initial }: { initial: DeskSnapshot }) {
  const [data, setData] = useState(initial);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [identity, setIdentity] = useState(initial.settings);
  const [siteForm, setSiteForm] = useState({ systemId: "", name: "", ingestUrl: "", outboundKey: "", notes: "" });
  const [pair, setPair] = useState({ origin: "", pairingCode: "" });
  const [password, setPassword] = useState({ current: "", next: "" });

  useEffect(() => setOrigin(window.location.origin), []);
  const ingest = origin ? `${origin}/api/v1/ingest` : "";

  async function run(task: () => Promise<void>) {
    setError("");
    setNotice("");
    try {
      await task();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something failed.");
    }
  }

  return (
    <section className="library wrap">
      <p className="kicker">Relay</p>
      <h1>Desks & keys</h1>
      <p className="lede" style={{ color: "#d9d0c4" }}>
        {data.counts.stories} stories · {data.counts.questions} questions · {data.counts.drafts} drafts. This desk’s id is <span className="mono">{data.settings.systemId}</span>.
      </p>
      {error ? <p className="bad">{error}</p> : null}
      {notice ? <p className="ok">{notice}</p> : null}

      <div className="panel">
        <h2>This desk</h2>
        <div className="secret"><span>Ingest address</span><span className="mono">{ingest || "…"}</span><Copy value={ingest} /></div>
        <div className="secret"><span>System id</span><span className="mono">{data.settings.systemId}</span><Copy value={data.settings.systemId} /></div>
        <p className="fine">Give another site this address and an inbound key from a linked desk. Pieces they send are filed here by kind, with their byline and their dates.</p>
        <div className="grid-2">
          <label className="field"><span>Desk name</span><input value={identity.deskName} onChange={(event) => setIdentity({ ...identity, deskName: event.target.value })} /></label>
          <label className="field"><span>System id</span><input value={identity.systemId} onChange={(event) => setIdentity({ ...identity, systemId: event.target.value })} /></label>
        </div>
        <label className="field" style={{ marginTop: 8 }}><span>Public line</span><input value={identity.deskLine} onChange={(event) => setIdentity({ ...identity, deskLine: event.target.value })} /></label>
        <button className="btn btn-primary btn-tiny" style={{ marginTop: 10 }} type="button" onClick={() => void run(async () => {
          const next = await call<DeskSnapshot>("/api/settings", { method: "POST", body: JSON.stringify({ action: "identity", ...identity }) });
          setData(next);
          setIdentity(next.settings);
          setNotice("The desk name and id are updated.");
        })}>Save identity</button>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>Pair with another Bloghave</h2>
          <p className="fine">On the other desk, create a pairing code. Paste their address and the code here. Both directions are linked.</p>
          <label className="field"><span>Their address</span><input value={pair.origin} placeholder="https://other.example" onChange={(event) => setPair({ ...pair, origin: event.target.value })} /></label>
          <label className="field"><span>Pairing code</span><input value={pair.pairingCode} placeholder="BH-••••••••" onChange={(event) => setPair({ ...pair, pairingCode: event.target.value })} /></label>
          <button className="btn btn-primary btn-tiny" type="button" onClick={() => void run(async () => {
            const result = await call<{ snapshot: DeskSnapshot }>("/api/settings", { method: "POST", body: JSON.stringify({ action: "link", ...pair }) });
            setData(result.snapshot);
            setPair({ origin: "", pairingCode: "" });
            setNotice("The desks are linked both ways.");
          })}>Link desks</button>
          <button className="btn btn-ghost btn-tiny" style={{ marginLeft: 8 }} type="button" onClick={() => void run(async () => {
            const result = await call<{ code: { code: string }; snapshot: DeskSnapshot }>("/api/settings", { method: "POST", body: JSON.stringify({ action: "pairing" }) });
            setData(result.snapshot);
            setNotice(`Pairing code ${result.code.code} is ready for 24 hours.`);
          })}>Create a pairing code</button>
          {data.pairingCodes.map((code) => (
            <div className="secret" key={code.code}>
              <span className="mono">{code.code}</span>
              <span>{code.usedAt ? `Used by ${code.usedBy}` : `Expires ${formatStamp(code.expiresAt)}`}</span>
              {!code.usedAt ? <Copy value={code.code} /> : null}
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Register a desk by hand</h2>
          <p className="fine">For a site that is not Bloghave, give it your ingest address and the inbound key this form creates. Put their address and the key they gave you below.</p>
          <label className="field"><span>System id</span><input value={siteForm.systemId} placeholder="north-desk" onChange={(event) => setSiteForm({ ...siteForm, systemId: event.target.value })} /></label>
          <label className="field"><span>Name</span><input value={siteForm.name} onChange={(event) => setSiteForm({ ...siteForm, name: event.target.value })} /></label>
          <label className="field"><span>Their ingest address</span><input value={siteForm.ingestUrl} placeholder="https://other.example/api/v1/ingest" onChange={(event) => setSiteForm({ ...siteForm, ingestUrl: event.target.value })} /></label>
          <label className="field"><span>Key you send them</span><input value={siteForm.outboundKey} onChange={(event) => setSiteForm({ ...siteForm, outboundKey: event.target.value })} /></label>
          <label className="field"><span>Notes</span><input value={siteForm.notes} onChange={(event) => setSiteForm({ ...siteForm, notes: event.target.value })} /></label>
          <button className="btn btn-primary btn-tiny" type="button" onClick={() => void run(async () => {
            await call("/api/sites", { method: "POST", body: JSON.stringify(siteForm) });
            setData(await call<DeskSnapshot>("/api/settings"));
            setSiteForm({ systemId: "", name: "", ingestUrl: "", outboundKey: "", notes: "" });
            setNotice("The desk is registered. Copy its inbound key to the other site.");
          })}>Register desk</button>
        </div>
      </div>

      <div className="site-grid">
        {data.sites.map((site) => <SiteCard key={site.id} site={site} onChange={(next) => setData(next)} onError={setError} onNotice={setNotice} />)}
        {data.sites.length === 0 ? <div className="empty">No other desks yet. This one still publishes to itself.</div> : null}
      </div>

      <div className="panel">
        <h2>What the other site receives</h2>
        <pre className="snippet">{`POST ${ingest || "https://your-desk/api/v1/ingest"}
Authorization: Bearer INBOUND_KEY
Content-Type: application/json

{
  "spec": "bloghave.v1",
  "type": "entry",
  "originSystemId": "their-system-id",
  "originDeskName": "Their desk",
  "targetSystemId": "${data.settings.systemId}",
  "sentAt": "2026-10-25T08:00:00.000Z",
  "entry": {
    "id": "their-piece-id",
    "kind": "article",
    "title": "Headline",
    "slug": "headline",
    "excerpt": "Deck",
    "section": "Field notes",
    "contentHtml": "<p>The page, as edited.</p>",
    "author": { "name": "Writer", "role": "Editor", "email": "", "bio": "", "avatarUrl": "" },
    "createdAt": "2026-10-25T07:00:00.000Z",
    "publishedAt": "2026-10-25T08:00:00.000Z"
  }
}`}</pre>
        <p className="fine">kind is <span className="mono">article</span> or <span className="mono">faq</span>. Images can travel in <span className="mono">assets</span> as base64 so this desk stores its own copies. Pull with <span className="mono">GET /api/v1/posts</span> and the same key.</p>
      </div>

      <div className="panel">
        <h2>Ledger</h2>
        <div className="ledger">
          {data.deliveries.map((item) => (
            <div key={item.id}>
              <span>{formatStamp(item.createdAt)} · {item.action} · {item.postTitle || "Ping"} → {item.systemId}</span>
              <span className={item.ok ? "ok" : "bad"}>{item.ok ? "Received" : item.message}</span>
            </div>
          ))}
          {data.deliveries.length === 0 ? <p className="fine">Nothing has been sent yet.</p> : null}
        </div>
      </div>

      <div className="panel">
        <h2>Password</h2>
        <div className="grid-2">
          <label className="field"><span>Current</span><input type="password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} /></label>
          <label className="field"><span>New</span><input type="password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} /></label>
        </div>
        <button className="btn btn-ghost btn-tiny" style={{ marginTop: 10 }} type="button" onClick={() => void run(async () => {
          const next = await call<DeskSnapshot>("/api/settings", { method: "POST", body: JSON.stringify({ action: "password", ...password }) });
          setData(next);
          setPassword({ current: "", next: "" });
          setNotice("The password is changed.");
        })}>Change password</button>
        <p className="fine">On a public host, set BLOGHAVE_SECRET so session cookies are signed with your own value.</p>
      </div>
    </section>
  );
}

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn btn-ghost btn-tiny" type="button" onClick={async () => {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    }}>{done ? "Copied" : "Copy"}</button>
  );
}

function SiteCard({
  site,
  onChange,
  onError,
  onNotice,
}: {
  site: Site;
  onChange: (snapshot: DeskSnapshot) => void;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
}) {
  async function act(task: () => Promise<void>) {
    onError("");
    onNotice("");
    try {
      await task();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Something failed.");
    }
  }
  return (
    <article className="panel">
      <h2>{site.name}</h2>
      <p className="mono">{site.systemId}</p>
      <p className="fine">{site.ingestUrl || "No outbound address yet"}</p>
      <div className="secret"><span>Inbound key</span><Copy value={site.inboundKey} /></div>
      <p className="mono">{site.inboundKey}</p>
      <div className="secret"><span>Key you send</span><span className="mono">{site.outboundKey || "Not set"}</span></div>
      <p className="fine">{site.lastTestedAt ? `${site.lastTestOk ? "Last ping succeeded" : "Last ping failed"} · ${site.lastTestMessage}` : "Not pinged yet."}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-tiny" type="button" onClick={() => void act(async () => {
          const result = await call<{ result: { ok: boolean; message: string } }>(`/api/sites/${site.id}/test`, { method: "POST", body: "{}" });
          onChange(await call<DeskSnapshot>("/api/settings"));
          onNotice(result.result.ok ? `${site.systemId} answered.` : result.result.message);
        })}>Ping</button>
        <button className="btn btn-ghost btn-tiny" type="button" onClick={() => void act(async () => {
          await call(`/api/sites/${site.id}`, { method: "PATCH", body: JSON.stringify({ active: !site.active }) });
          onChange(await call<DeskSnapshot>("/api/settings"));
        })}>{site.active ? "Pause" : "Resume"}</button>
        <button className="btn btn-ghost btn-tiny" type="button" onClick={() => void act(async () => {
          if (!confirm(`Unlink ${site.systemId}?`)) return;
          await call(`/api/sites/${site.id}`, { method: "DELETE" });
          onChange(await call<DeskSnapshot>("/api/settings"));
        })}>Unlink</button>
      </div>
    </article>
  );
}
