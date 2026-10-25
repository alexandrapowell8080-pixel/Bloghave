<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDesk
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->get('desk') === true) {
            return $next($request);
        }
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['error' => 'Sign in to the desk.'], 401);
        }

        return redirect('/login?next='.urlencode('/'.ltrim($request->path(), '/')));
    }
}
