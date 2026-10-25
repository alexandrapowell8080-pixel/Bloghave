@extends('layouts.public')

@section('content')
<article class="sheet wrap">
    <header>
        <p class="kicker">Story{{ $post->section ? ' · '.$post->section : '' }}</p>
        <h1 class="story-title">{{ $post->title }}</h1>
        @if ($post->excerpt)<p class="dek">{{ $post->excerpt }}</p>@endif
        <div class="byline">
            @if (!empty($post->author['avatarUrl']))
                <img class="avatar" src="{{ $post->author['avatarUrl'] }}" alt="" width="46" height="46">
            @else
                <span class="avatar-letter" style="width:46px;height:46px" aria-hidden>{{ strtoupper(mb_substr($post->authorName() ?: '?', 0, 1)) }}</span>
            @endif
            <div>
                <strong>{{ $post->authorName() }}</strong>
                <p>{{ collect([$post->author['role'] ?? '', $post->author['bio'] ?? ''])->filter()->implode(' — ') }}</p>
            </div>
        </div>
        <div class="dates">
            <span>Created {{ \App\Support\Text::formatStamp($post->created_at) }}</span>
            @if ($post->published_at)<span>Published {{ \App\Support\Text::formatStamp($post->published_at) }}</span>@endif
            @if ($post->reading_minutes)<span>{{ $post->reading_minutes }} min read</span>@endif
            @if ($post->source_desk_name)<span>Arrived from {{ $post->source_desk_name }}</span>@endif
        </div>
        @if ($post->cover_image)
            <figure class="figure">
                <img src="{{ $post->cover_image }}" alt="{{ $post->title }}">
                @if ($post->cover_caption)<figcaption>{{ $post->cover_caption }}</figcaption>@endif
            </figure>
        @endif
    </header>
    <div class="prose-bh">{!! $html !!}</div>
    @if ($post->tags)
        <div class="tags">
            @foreach ($post->tags as $tag)
                <a href="/blog?tag={{ urlencode($tag) }}">{{ $tag }}</a>
            @endforeach
        </div>
    @endif
</article>
@endsection
