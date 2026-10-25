@php
    $meta = $meta ?? [];
    $fullTitle = !empty($meta['absolute']) ? ($meta['title'] ?? 'Bloghave') : (($meta['title'] ?? 'Bloghave').' · Bloghave');
    $canonical = \App\Support\Seo::abs($meta['path'] ?? '/');
    $keywords = implode(', ', $meta['keywords'] ?? \App\Support\Seo::KEYWORDS);
    $description = $meta['description'] ?? \App\Support\Seo::HOME_DESCRIPTION;
    $index = $meta['index'] ?? true;
@endphp
<title>{{ $fullTitle }}</title>
<meta name="description" content="{{ $description }}">
<meta name="keywords" content="{{ $keywords }}">
<link rel="canonical" href="{{ $canonical }}">
<meta name="robots" content="{{ $index ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow' }}">
<meta property="og:title" content="{{ $meta['title'] ?? 'Bloghave' }}">
<meta property="og:description" content="{{ $description }}">
<meta property="og:url" content="{{ $canonical }}">
<meta property="og:site_name" content="Bloghave">
<meta property="og:locale" content="en_GB">
<meta property="og:type" content="{{ !empty($meta['article']) ? 'article' : 'website' }}">
@if (!empty($meta['image']))
<meta property="og:image" content="{{ $meta['image'] }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{{ $meta['image'] }}">
@else
<meta name="twitter:card" content="summary">
@endif
<meta name="twitter:title" content="{{ $meta['title'] ?? 'Bloghave' }}">
<meta name="twitter:description" content="{{ $description }}">
@if (!empty($meta['article']['publishedTime']))
<meta property="article:published_time" content="{{ $meta['article']['publishedTime'] }}">
@endif
@if (!empty($meta['article']['modifiedTime']))
<meta property="article:modified_time" content="{{ $meta['article']['modifiedTime'] }}">
@endif
