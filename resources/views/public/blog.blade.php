@extends('layouts.public')

@section('content')
<section class="wrap">
    <p class="kicker">Stories</p>
    <h1 class="story-title">The archive</h1>
    <p class="lede">Every article published to this desk, with the writer and the dates the desk stamped.</p>
    <form class="archive-tools" method="get" action="/blog">
        <input class="text-input" type="search" name="q" value="{{ request('q') }}" placeholder="Search stories" aria-label="Search stories">
    </form>
    <div class="story-grid">
        @php
            $query = mb_strtolower((string) request('q', ''));
            $shown = $stories->filter(function ($story) use ($query) {
                if ($query === '') return true;
                $hay = mb_strtolower($story->title.' '.$story->excerpt.' '.$story->authorName().' '.$story->section);
                return str_contains($hay, $query);
            });
        @endphp
        @forelse ($shown as $story)
            <a class="story-card" href="/blog/{{ $story->slug }}">
                @include('partials.cover', ['src' => $story->cover_image, 'seed' => $story->slug, 'alt' => ''])
                <div class="pad">
                    <span class="stamp">{{ $story->section ?: 'Story' }}</span>
                    <h3>{{ $story->title }}</h3>
                    <p class="meta" style="margin:0">{{ $story->excerpt }}</p>
                    <p class="meta" style="margin-top:auto">{{ $story->authorName() }} · {{ \App\Support\Text::formatStamp($story->published_at ?: $story->created_at) }}@if ($story->reading_minutes) · {{ $story->reading_minutes }} min @endif</p>
                </div>
            </a>
        @empty
            <div class="empty">Nothing matches that yet.</div>
        @endforelse
    </div>
</section>
@endsection
