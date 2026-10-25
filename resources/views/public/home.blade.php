@extends('layouts.public')

@section('content')
<section class="hero wrap">
    <div>
        <p class="kicker">The writing desk</p>
        <h1 class="story-title">Write it once. It arrives intact.</h1>
        <p class="lede">Articles and questions are different shapes. Both leave with their type, their pictures, the writer’s name, and the two times the desk stamped itself.</p>
        <div class="hero-actions">
            <a class="btn btn-primary" href="/desk">Open the desk</a>
            <a class="btn btn-ghost" href="/blog">Read the stories</a>
        </div>
    </div>
    @if ($featured)
        <a class="feature-card" href="/blog/{{ $featured->slug }}">
            <div class="feature-cover">
                @include('partials.cover', ['src' => $featured->cover_image, 'seed' => $featured->slug, 'alt' => '', 'mark' => false])
                <div class="feature-type">
                    <p class="cover-type" id="cover-type" aria-label="welcome to Fellohtech.com services. Write it once. It arrives intact. Stories and questions, sent intact.">
                        <span class="type-text" aria-hidden="true"></span><span class="type-caret" aria-hidden="true"></span>
                    </p>
                </div>
            </div>
            <div class="feature-copy">
                <span class="stamp">{{ $featured->section ?: 'Story' }}</span>
                <h2>{{ $featured->title }}</h2>
                <p class="dek" style="font-size:1.05rem">{{ $featured->excerpt }}</p>
                <p class="meta">{{ $featured->authorName() }} · {{ \App\Support\Text::formatStamp($featured->published_at) }}</p>
            </div>
        </a>
    @else
        <div class="empty">The first story you publish to this desk will stand here.</div>
    @endif
</section>
<section class="wrap">
    <div class="section-head">
        <h2>Latest stories</h2>
        <a href="/blog">Archive</a>
    </div>
    @if ($rest->isNotEmpty())
        <div class="story-grid">
            @foreach ($rest as $story)
                <a class="story-card" href="/blog/{{ $story->slug }}">
                    <div class="pad">
                        <span class="stamp">{{ $story->section ?: 'Story' }}</span>
                        <h3>{{ $story->title }}</h3>
                        <p class="meta">{{ $story->excerpt }}</p>
                        <p class="meta">{{ $story->authorName() }} · {{ \App\Support\Text::formatStamp($story->published_at) }}</p>
                    </div>
                </a>
            @endforeach
        </div>
    @endif
</section>
<section class="faq-band">
    <div class="wrap faq-band-grid">
        <div>
            <p class="kicker">Questions</p>
            <h2>FAQs keep their own shape.</h2>
            <p>A question is a category, a short answer, and the fuller one. It does not borrow a feature’s costume on the way out.</p>
            <a href="/faq">All questions</a>
        </div>
        <ol class="faq-list">
            @foreach (collect($faqs)->take(4) as $faq)
                <li>
                    <a href="/faq/{{ $faq->slug }}">
                        <span>{{ $faq->section }}</span>
                        <strong>{{ $faq->title }}</strong>
                    </a>
                </li>
            @endforeach
        </ol>
    </div>
</section>
<section class="wrap">
    <div class="section-head"><h2>How a desk is linked</h2></div>
    <div class="steps">
        <article class="step"><em>01</em><h3>Name the system</h3><p>Register the other site with a system id, its ingest address, and the key it gave you.</p></article>
        <article class="step"><em>02</em><h3>Give it a way back</h3><p>Hand over this desk’s ingest address and inbound key, or pair both Bloghave desks with a code.</p></article>
        <article class="step"><em>03</em><h3>Choose the id and send</h3><p>The headline, figure, answer, byline, and both dates go to that system as you left them.</p></article>
    </div>
</section>
@endsection

@push('scripts')
<script>
(() => {
    const lines = [
        "welcome to Fellohtech.com services",
        "Write it once. It arrives intact.",
        "Stories and questions, sent intact."
    ];
    const node = document.querySelector("#cover-type .type-text");
    const caret = document.querySelector("#cover-type .type-caret");
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        node.textContent = lines[0];
        if (caret) caret.remove();
        return;
    }
    let line = 0, index = 0, deleting = false;
    const tick = () => {
        const full = lines[line] || "";
        if (!deleting) {
            index += 1;
            node.textContent = full.slice(0, index);
            if (index >= full.length) { deleting = true; setTimeout(tick, 1600); return; }
            setTimeout(tick, 74);
            return;
        }
        index -= 1;
        node.textContent = full.slice(0, Math.max(index, 0));
        if (index <= 0) { deleting = false; line = (line + 1) % lines.length; setTimeout(tick, 460); return; }
        setTimeout(tick, 40);
    };
    setTimeout(tick, 360);
})();
</script>
@endpush
