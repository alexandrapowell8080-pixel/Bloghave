<?php

return [
    'url' => rtrim((string) env('BLOGHAVE_URL', env('APP_URL', 'http://127.0.0.1:8000')), '/'),
    'secret' => env('BLOGHAVE_SECRET', 'bloghave-desk-session-v1'),
];
