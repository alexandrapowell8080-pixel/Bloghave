<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,460;0,9..144,560;1,9..144,560&family=Outfit:wght@400;580;650;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/bloghave.css">
    @include('partials.meta')
    @include('partials.jsonld')
</head>
<body>
    <header class="mast">
        <a class="skip" href="#content">Skip to the piece</a>
        <div class="wrap utility">
            <span>{{ \App\Support\Text::formatDay(now()) }}</span>
            <span>{{ $desk->desk_name ?? 'The house desk' }} · {{ $desk->system_id ?? 'bloghave' }}</span>
        </div>
        <div class="wrap mast-row">
            @include('partials.logo')
            <button class="btn btn-ghost btn-tiny nav-toggle" type="button" aria-expanded="false">Menu</button>
            <nav class="nav-links" aria-label="Primary">
                <a href="/blog" @if (request()->is('blog*')) aria-current="page" @endif>Stories</a>
                <a href="/faq" @if (request()->is('faq*')) aria-current="page" @endif>FAQs</a>
                <a href="/desk" @if (request()->is('desk*')) aria-current="page" @endif>Write</a>
                <a href="/admin" @if (request()->is('admin*')) aria-current="page" @endif>Desks</a>
            </nav>
        </div>
        <div class="wrap" style="padding-bottom:10px;color:#4a433b">{{ $desk->desk_line ?? 'Stories and questions, sent intact.' }}</div>
    </header>
    <main id="content">
        <div class="wrap">@include('partials.crumbs')</div>
        @yield('content')
    </main>
    @include('partials.footer')
    <script>
        document.querySelectorAll('.nav-toggle').forEach((button) => {
            button.addEventListener('click', () => {
                const nav = button.parentElement.querySelector('.nav-links');
                const open = nav.classList.toggle('open');
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });
    </script>
    @stack('scripts')
</body>
</html>
