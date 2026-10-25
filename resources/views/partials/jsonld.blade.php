@foreach ($jsonld ?? [] as $block)
<script type="application/ld+json">{!! json_encode($block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}</script>
@endforeach
@if (!empty($crumbs))
<script type="application/ld+json">{!! json_encode(\App\Support\Seo::breadcrumb($crumbs), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}</script>
@endif
