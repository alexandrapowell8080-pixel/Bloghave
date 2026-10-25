@extends('layouts.desk')

@section('content')
<div id="composer-app"
    data-post='@json($presented)'
    data-system='{{ $settings->system_id }}'
    data-desk='{{ $settings->desk_name }}'
    data-sites='@json($sites->map(fn ($site) => ["systemId" => $site->system_id, "name" => $site->name, "active" => $site->active])->values())'>
    <div class="composer-top">
        <div>
            <a href="/desk" style="color:#c9bfb2;text-decoration:none">Library</a>
            <div class="save-state" id="save-state">Saved · /{{ $post->kind === 'faq' ? 'faq' : 'blog' }}/{{ $post->slug }}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-tiny" id="save-draft" type="button">Save draft</button>
            <button class="btn btn-primary btn-tiny" id="publish" type="button">Publish</button>
        </div>
    </div>
    <p class="bad wrap" id="compose-error" hidden></p>
    <div class="composer">
        <aside class="outline" id="outline"></aside>
        <div class="sheet">
            <header>
                <p class="kicker">{{ $post->kind === 'faq' ? 'FAQ' : 'Story' }}</p>
                <input class="sheet-input section-input" id="field-section" value="{{ $post->section }}" placeholder="{{ $post->kind === 'faq' ? 'Category' : 'Section' }}">
                <textarea class="sheet-input title-input" id="field-title" rows="1" placeholder="{{ $post->kind === 'faq' ? 'The question' : 'The headline' }}">{{ $post->title }}</textarea>
                <textarea class="sheet-input dek-input" id="field-excerpt" rows="2" placeholder="{{ $post->kind === 'faq' ? 'The short answer' : 'The deck' }}">{{ $post->excerpt }}</textarea>
                <div class="byline">
                    <span class="avatar-letter" id="avatar-letter" style="width:46px;height:46px" aria-hidden>{{ strtoupper(mb_substr($post->authorName() ?: '?', 0, 1)) }}</span>
                    <div>
                        <strong id="byline-name">{{ $post->authorName() ?: 'Writer’s name' }}</strong>
                        <p id="byline-note">{{ collect([$post->author['role'] ?? '', $post->author['bio'] ?? ''])->filter()->implode(' — ') ?: 'Role and a short note' }}</p>
                    </div>
                </div>
                <div class="dates">
                    <span>Created {{ \App\Support\Text::formatStamp($post->created_at) }}</span>
                    <span id="published-stamp">{{ $post->published_at ? 'Published '.\App\Support\Text::formatStamp($post->published_at) : 'Publishes when you send' }}</span>
                    <span id="reading">{{ $post->reading_minutes ? $post->reading_minutes.' min read' : '' }}</span>
                </div>
                <div class="figure">
                    <label class="cover-edit">
                        <span id="cover-slot">
                            @if ($post->cover_image)
                                <img class="cover" src="{{ $post->cover_image }}" alt="">
                            @else
                                <span>Add a figure</span>
                            @endif
                        </span>
                        <input id="cover-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
                    </label>
                    <div class="cover-actions">
                        <button class="btn btn-ghost btn-tiny" id="cover-clear" type="button" @if (!$post->cover_image) hidden @endif>Remove figure</button>
                    </div>
                    <input class="sheet-input" id="field-caption" style="margin-top:8px;color:#3c342c" value="{{ $post->cover_caption }}" placeholder="Caption" @if (!$post->cover_image) hidden @endif>
                </div>
            </header>
            <div class="tool" id="toolbar"></div>
            <div class="prose-bh" id="editor"></div>
        </div>
        <aside class="inspector">
            <label class="field"><span>Writer</span><input id="author-name" value="{{ $post->author['name'] ?? '' }}"></label>
            <label class="field"><span>Role</span><input id="author-role" value="{{ $post->author['role'] ?? '' }}"></label>
            <label class="field"><span>Email</span><input id="author-email" value="{{ $post->author['email'] ?? '' }}" placeholder="Kept off the public page"></label>
            <label class="field"><span>Short bio</span><textarea id="author-bio" rows="3">{{ $post->author['bio'] ?? '' }}</textarea></label>
            <label class="field"><span>Slug</span><input id="field-slug" value="{{ $post->slug }}"></label>
            <label class="field"><span>Tags</span><input id="field-tags" value="{{ implode(', ', $post->tags ?? []) }}" placeholder="desk, delivery"></label>
            <label class="field"><span><input id="field-featured" type="checkbox" @checked($post->featured)> Feature on the home page</span></label>
            <div class="field">
                <span>Send to</span>
                <label><input class="target" type="checkbox" value="{{ $settings->system_id }}" checked> {{ $settings->desk_name }} · this desk</label>
                @foreach ($sites as $site)
                    <label><input class="target" type="checkbox" value="{{ $site->system_id }}" @disabled(!$site->active)> {{ $site->name }}</label>
                @endforeach
            </div>
            <button class="btn btn-ghost btn-tiny" id="unpublish" type="button">Take down from the selected desks</button>
            <div id="receipts"></div>
        </aside>
    </div>
</div>
@endsection

@push('scripts')
<script src="/js/compose.js"></script>
@endpush
