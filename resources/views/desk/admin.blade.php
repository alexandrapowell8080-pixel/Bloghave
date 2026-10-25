@extends('layouts.desk')

@section('content')
<section class="library wrap">
    <p class="kicker">Relay</p>
    <h1>Desks</h1>
    <p class="lede" style="color:#d9d0c4">{{ $counts['stories'] }} stories · {{ $counts['questions'] }} questions · {{ $counts['drafts'] }} drafts. This desk’s id is <span class="mono">{{ $settings->system_id }}</span>.</p>
    @if (session('error'))<p class="bad">{{ session('error') }}</p>@endif
    @if (session('notice'))<p class="ok">{{ session('notice') }}</p>@endif

    <div class="panel">
        <div class="secret"><span>Ingest address</span><span class="mono">{{ $ingest }}</span></div>
        <div class="secret"><span>System id</span><span class="mono">{{ $settings->system_id }}</span></div>
        <p class="fine">Give another site this address and an inbound key from a linked desk. Pieces they send are filed here by kind, with their byline and their dates.</p>
        <form method="post" action="/admin">
            @csrf
            <input type="hidden" name="action" value="identity">
            <div class="grid-2">
                <label class="field"><span>Desk name</span><input name="deskName" value="{{ $settings->desk_name }}"></label>
                <label class="field"><span>System id</span><input name="systemId" value="{{ $settings->system_id }}"></label>
            </div>
            <label class="field" style="margin-top:8px"><span>Public line</span><input name="deskLine" value="{{ $settings->desk_line }}"></label>
            <button class="btn btn-primary btn-tiny" style="margin-top:10px" type="submit">Save identity</button>
        </form>
    </div>

    <div class="grid-2">
        <div class="panel">
            <h2>Pair two Bloghave desks</h2>
            <p class="fine">On the other desk, create a pairing code. Paste their address and the code here. Both directions are linked.</p>
            <form method="post" action="/admin">
                @csrf
                <input type="hidden" name="action" value="link">
                <label class="field"><span>Their address</span><input name="origin" placeholder="https://other.example"></label>
                <label class="field"><span>Pairing code</span><input name="pairingCode" placeholder="BH-••••••••"></label>
                <button class="btn btn-primary btn-tiny" type="submit">Link with code</button>
            </form>
            <form method="post" action="/admin" style="margin-top:8px">
                @csrf
                <input type="hidden" name="action" value="pairing">
                <button class="btn btn-ghost btn-tiny" type="submit">Create a pairing code</button>
            </form>
            @foreach ($codes as $code)
                <div class="secret">
                    <span class="mono">{{ $code->code }}</span>
                    <span>{{ $code->used_at ? 'Used' : 'Expires '.$code->expires_at->diffForHumans() }}</span>
                </div>
            @endforeach
        </div>
        <div class="panel">
            <h2>Register a site</h2>
            <p class="fine">For a site that is not Bloghave, give it your ingest address and the inbound key this form creates. Put their address and the key they gave you below.</p>
            <form method="post" action="/admin">
                @csrf
                <input type="hidden" name="action" value="site">
                <label class="field"><span>System id</span><input name="systemId" placeholder="north-desk" required></label>
                <label class="field"><span>Name</span><input name="name"></label>
                <label class="field"><span>Their ingest address</span><input name="ingestUrl" placeholder="https://other.example/api/v1/ingest"></label>
                <label class="field"><span>Key you send them</span><input name="outboundKey"></label>
                <label class="field"><span>Notes</span><input name="notes"></label>
                <button class="btn btn-primary btn-tiny" type="submit">Register</button>
            </form>
        </div>
    </div>

    <div class="site-grid">
        @forelse ($sites as $site)
            <article class="panel">
                <h2>{{ $site->name }}</h2>
                <p class="mono">{{ $site->system_id }}</p>
                <p class="fine">{{ $site->ingest_url ?: 'No outbound address yet' }}</p>
                <div class="secret"><span>Inbound key</span></div>
                <p class="mono">{{ $site->inbound_key }}</p>
                <div class="secret"><span>Key you send</span><span class="mono">{{ $site->outbound_key ?: 'Not set' }}</span></div>
                <p class="fine">{{ $site->last_tested_at ? (($site->last_test_ok ? 'Last ping succeeded' : 'Last ping failed').' · '.$site->last_test_message) : 'Not pinged yet.' }}</p>
                <form method="post" action="/admin/sites/{{ $site->id }}/test" style="display:inline">@csrf<button class="btn btn-ghost btn-tiny" type="submit">Ping</button></form>
                <form method="post" action="/admin/sites/{{ $site->id }}" style="display:inline">@csrf<input type="hidden" name="active" value="{{ $site->active ? '0' : '1' }}"><button class="btn btn-ghost btn-tiny" type="submit">{{ $site->active ? 'Pause' : 'Resume' }}</button></form>
                <form method="post" action="/admin/sites/{{ $site->id }}/delete" style="display:inline" onsubmit="return confirm('Remove this linked desk?')">@csrf<button class="btn btn-ghost btn-tiny" type="submit">Remove</button></form>
            </article>
        @empty
            <div class="empty">No other desks yet. This one still publishes to itself.</div>
        @endforelse
    </div>

    <div class="panel">
        <h2>What the other site sends</h2>
        <pre class="snippet">POST {{ $ingest }}
Authorization: Bearer &lt;inbound key&gt;
Content-Type: application/json

{
  "spec": "bloghave.v1",
  "type": "entry",
  "originSystemId": "&lt;their system id&gt;",
  "entry": { "id": "...", "kind": "article", "title": "...", "author": { "name": "..." }, "contentHtml": "&lt;p&gt;...&lt;/p&gt;" }
}</pre>
        <p class="fine">kind is <span class="mono">article</span> or <span class="mono">faq</span>. Images can travel in <span class="mono">assets</span> as base64 so this desk stores its own copies. Pull with <span class="mono">GET /api/v1/posts?embed=1</span> and the same key.</p>
    </div>

    <div class="panel">
        <h2>Ledger</h2>
        <div class="ledger">
            @forelse ($deliveries as $item)
                <div>
                    <strong>{{ $item->post_title }}</strong>
                    <span>{{ $item->action }} · {{ $item->site_name }}</span>
                    <span class="{{ $item->ok ? 'ok' : 'bad' }}">{{ $item->ok ? 'Received' : $item->message }}</span>
                </div>
            @empty
                <p class="fine">Nothing has been sent yet.</p>
            @endforelse
        </div>
    </div>

    <div class="panel">
        <h2>Password</h2>
        <form method="post" action="/admin">
            @csrf
            <input type="hidden" name="action" value="password">
            <div class="grid-2">
                <label class="field"><span>Current</span><input type="password" name="current"></label>
                <label class="field"><span>New</span><input type="password" name="next"></label>
            </div>
            <button class="btn btn-ghost btn-tiny" style="margin-top:10px" type="submit">Change password</button>
        </form>
        <p class="fine">On a public host, set APP_URL and BLOGHAVE_URL to the public address, then run composer install, php artisan key:generate, and php artisan migrate --seed. The document root is public/.</p>
    </div>
</section>
@endsection
