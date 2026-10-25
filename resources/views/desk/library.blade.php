@extends('layouts.desk')

@section('content')
<section class="library wrap">
    <div class="library-head">
        <div>
            <p class="kicker">Manuscripts</p>
            <h1>The library</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
            <form action="/desk/posts" method="post">@csrf<input type="hidden" name="kind" value="article"><button class="btn btn-primary" type="submit">New story</button></form>
            <form action="/desk/posts" method="post">@csrf<input type="hidden" name="kind" value="faq"><button class="btn btn-ghost" type="submit">New FAQ</button></form>
        </div>
    </div>
    <div class="filters">
        @foreach (['/desk' => 'All', '/desk?kind=article' => 'Articles', '/desk?kind=faq' => 'FAQs', '/desk?status=draft' => 'Drafts', '/desk?status=published' => 'Published', '/desk?status=received' => 'Arrived'] as $href => $label)
            <a href="{{ $href }}" @if ($current === $href) aria-current="page" @endif>{{ $label }}</a>
        @endforeach
    </div>
    <div class="morgue">
        @forelse ($posts as $card)
            <div class="row">
                <div>
                    <strong>{{ $card->title ?: 'Untitled' }}</strong>
                    <em>{{ $card->excerpt ?: 'No deck yet' }}</em>
                </div>
                <span class="stamp">{{ $card->kind === 'faq' ? 'FAQ' : 'Story' }}</span>
                <span>{{ $card->authorName() ?: 'Unsigned' }}</span>
                <span>{{ \App\Support\Text::formatStamp($card->created_at) }}</span>
                <span>{{ $card->published_at ? \App\Support\Text::formatStamp($card->published_at) : $card->status }}</span>
                <div class="row-actions">
                    <a class="btn btn-ghost btn-tiny" href="/desk/compose/{{ $card->id }}">Edit</a>
                    @if ($card->status === 'received' || in_array($systemId, $card->published_to ?? [], true))
                        <a class="btn btn-ghost btn-tiny" href="{{ $card->publicPath() }}">View</a>
                    @endif
                    <form action="/desk/posts/{{ $card->id }}/delete" method="post" onsubmit="return confirm('Remove this piece from the desk?')">
                        @csrf
                        <button class="btn btn-ghost btn-tiny" type="submit">Delete</button>
                    </form>
                </div>
            </div>
        @empty
            <div class="empty">Nothing in this drawer.</div>
        @endforelse
    </div>
</section>
@endsection
