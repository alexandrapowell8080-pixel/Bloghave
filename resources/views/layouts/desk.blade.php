<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,460;0,9..144,560;1,9..144,560&family=Outfit:wght@400;580;650;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/bloghave.css">
    @include('partials.meta')
    @include('partials.jsonld')
</head>
<body>
    <div class="desk-page on-night">
        <header class="desk-top">
            <div class="wrap desk-row">
                @include('partials.logo', ['light' => true])
                <button class="btn btn-ghost btn-tiny nav-toggle" type="button" aria-expanded="false">Menu</button>
                <nav class="nav-links" aria-label="Desk">
                    <a href="/desk" @if (request()->is('desk') && !request()->is('desk/compose*')) aria-current="page" @endif>Library</a>
                    <a href="/admin" @if (request()->is('admin')) aria-current="page" @endif>Desks</a>
                    <a href="/blog">Stories</a>
                    <form action="/logout" method="post" style="display:inline">
                        @csrf
                        <button class="linkish" type="submit">Sign out</button>
                    </form>
                </nav>
            </div>
        </header>
        <main id="content">
            <div class="wrap">@include('partials.crumbs')</div>
            @yield('content')
        </main>
        @include('partials.footer')
    </div>
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
