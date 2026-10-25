@extends('layouts.public')

@section('content')
<section class="wrap">
    <p class="kicker">Questions</p>
    <h1 class="story-title">The FAQ</h1>
    <p class="lede">Each question keeps its category, its short answer, and the fuller reply.</p>
    <div class="faq-layout">
        <aside class="cat-list">
            <a href="/faq" @if ($tag === '') aria-current="page" @endif>All</a>
            @foreach ($categories as $category)
                <a href="/faq?tag={{ urlencode($category) }}" @if ($tag === $category) aria-current="page" @endif>{{ $category }}</a>
            @endforeach
        </aside>
        <div>
            <input class="text-input" id="faq-search" placeholder="Search questions" aria-label="Search questions">
            <div id="faq-board">
                @forelse ($questions as $card)
                    <article class="question" data-search="{{ mb_strtolower($card->title.' '.$card->excerpt.' '.$card->section) }}">
                        <button class="q" type="button" aria-expanded="false">{{ $card->title }}</button>
                        <p class="short">{{ $card->excerpt }}</p>
                        <p class="meta">{{ $card->section }} · {{ $card->authorName() }} · Published {{ \App\Support\Text::formatStamp($card->published_at) }}</p>
                        <div class="answer" hidden>
                            <div class="prose-bh">{!! \App\Support\Text::stampHeadingIds((string) $card->content_html, $card->outline ?? []) !!}</div>
                            <p><a href="/faq/{{ $card->slug }}">Open the full question</a></p>
                        </div>
                    </article>
                @empty
                    <div class="empty">No questions in this category.</div>
                @endforelse
            </div>
        </div>
    </div>
</section>
@endsection

@push('scripts')
<script>
document.querySelectorAll(".question .q").forEach((button) => {
    button.addEventListener("click", () => {
        const answer = button.parentElement.querySelector(".answer");
        const open = answer.hasAttribute("hidden");
        document.querySelectorAll(".question .answer").forEach((node) => node.setAttribute("hidden", ""));
        document.querySelectorAll(".question .q").forEach((node) => node.setAttribute("aria-expanded", "false"));
        if (open) { answer.removeAttribute("hidden"); button.setAttribute("aria-expanded", "true"); }
    });
});
document.getElementById("faq-search")?.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll("#faq-board .question").forEach((node) => {
        node.hidden = query !== "" && !node.dataset.search.includes(query);
    });
});
</script>
@endpush
