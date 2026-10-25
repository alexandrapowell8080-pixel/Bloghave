@extends('layouts.public')

@section('content')
<article class="sheet wrap">
    <header>
        <p class="kicker">FAQ{{ $post->section ? ' · '.$post->section : '' }}</p>
        <h1 class="story-title">{{ $post->title }}</h1>
        @if ($post->excerpt)<p class="dek">{{ $post->excerpt }}</p>@endif
        <div class="byline">
            <span class="avatar-letter" style="width:46px;height:46px" aria-hidden>{{ strtoupper(mb_substr($post->authorName() ?: '?', 0, 1)) }}</span>
            <div>
                <strong>{{ $post->authorName() }}</strong>
                <p>{{ collect([$post->author['role'] ?? '', $post->author['bio'] ?? ''])->filter()->implode(' — ') }}</p>
            </div>
        </div>
        <div class="dates">
            <span>Created {{ \App\Support\Text::formatStamp($post->created_at) }}</span>
            @if ($post->published_at)<span>Published {{ \App\Support\Text::formatStamp($post->published_at) }}</span>@endif
            @if ($post->source_desk_name)<span>Arrived from {{ $post->source_desk_name }}</span>@endif
        </div>
    </header>
    <div class="prose-bh">{!! $html !!}</div>
    @if ($post->tags)
        <div class="tags">
            @foreach ($post->tags as $tag)
                <a href="/faq?tag={{ urlencode($tag) }}">{{ $tag }}</a>
            @endforeach
        </div>
    @endif
</article>
@endsection
