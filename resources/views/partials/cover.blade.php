@php
    $hue = \App\Support\Text::hueFrom($seed ?? 'bloghave');
@endphp
@if (!empty($src))
    <img class="{{ $class ?? 'cover' }}" src="{{ $src }}" alt="{{ $alt ?? '' }}">
@else
    <div class="cover-fallback {{ $class ?? 'cover' }}" style="background: linear-gradient(145deg, hsl({{ $hue }} 52% 42%), hsl({{ $hue + 24 }} 28% 16%))" @if (empty($alt)) aria-hidden="true" @endif>
        @if (!isset($mark) || $mark)
            <span>{{ strtoupper(mb_substr($alt ?: ($seed ?? 'B'), 0, 1)) }}</span>
        @endif
    </div>
@endif
