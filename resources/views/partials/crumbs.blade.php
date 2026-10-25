@if (!empty($crumbs))
<nav class="crumbs wrap" aria-label="Breadcrumb">
    <ol>
        @foreach ($crumbs as $crumb)
            <li>
                @if (!$loop->first)<span class="crumb-sep" aria-hidden="true">/</span>@endif
                @if ($loop->last)
                    <span aria-current="page">{{ $crumb['name'] }}</span>
                @else
                    <a href="{{ $crumb['path'] }}">{{ $crumb['name'] }}</a>
                @endif
            </li>
        @endforeach
    </ol>
</nav>
@endif
