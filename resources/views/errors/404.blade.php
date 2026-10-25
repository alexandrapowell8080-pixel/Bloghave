@php
    $meta = [
        'title' => 'Page not found',
        'description' => 'That page is not on this Bloghave desk.',
        'path' => request()->path(),
        'keywords' => \App\Support\Seo::keywords(['not found']),
        'index' => false,
    ];
    $crumbs = [['name' => 'Home', 'path' => '/'], ['name' => 'Not found', 'path' => '/'.request()->path()]];
    $jsonld = [\App\Support\Seo::webPage('Page not found', $meta['description'], '/'.ltrim(request()->path(), '/'))];
@endphp
@extends('layouts.public')

@section('content')
<section class="wrap">
    <p class="kicker">404</p>
    <h1 class="story-title">This page is not on the desk.</h1>
    <p class="lede"><a href="/">Return home</a></p>
</section>
@endsection
