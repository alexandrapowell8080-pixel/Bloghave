@extends('layouts.public')

@section('content')
<section class="wrap" style="max-width:520px;padding-bottom:64px">
    <p class="kicker">The desk</p>
    <h1 class="story-title">Sign in</h1>
    <p class="lede">The first password is <span class="mono">bloghave</span>. Change it in Desks once you are in.</p>
    @if (session('error'))<p class="bad">{{ session('error') }}</p>@endif
    <form class="panel" method="post" action="/login">
        @csrf
        <input type="hidden" name="next" value="{{ $next }}">
        <label class="field"><span>Password</span><input type="password" name="password" required autofocus></label>
        <button class="btn btn-primary" style="margin-top:12px" type="submit">Open the desk</button>
    </form>
</section>
@endsection
