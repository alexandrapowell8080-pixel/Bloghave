<?php

namespace App\Support;

use App\Models\Post;
use App\Models\Site;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class Delivery
{
    /** @var array<string, string> */
    private const MIME = [
        '.png' => 'image/png',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.gif' => 'image/gif',
        '.webp' => 'image/webp',
    ];

    /** @return array{entry: array<string, mixed>, assets: list<array<string, string>>} */
    public static function pack(Post $post, string $origin): array
    {
        $html = (string) $post->content_html;
        $author = $post->author ?? [];
        $packed = self::collect($html, array_filter([
            (string) $post->cover_image,
            (string) ($author['avatarUrl'] ?? ''),
        ]), $origin);

        $cover = (string) $post->cover_image;
        $avatar = (string) ($author['avatarUrl'] ?? '');
        $coverAsset = $cover !== '' ? self::assetFor($cover, $origin) : null;
        $avatarAsset = $avatar !== '' ? self::assetFor($avatar, $origin) : null;
        if ($coverAsset) {
            $cover = $coverAsset['sourceUrl'];
        }
        if ($avatarAsset) {
            $avatar = $avatarAsset['sourceUrl'];
        }
        $assets = $packed['assets'];
        foreach ([$coverAsset, $avatarAsset] as $extra) {
            if ($extra && ! collect($assets)->contains(fn ($asset) => $asset['filename'] === $extra['filename'])) {
                $assets[] = $extra;
            }
        }
        $author['avatarUrl'] = $avatar;

        return [
            'assets' => $assets,
            'entry' => [
                'id' => $post->id,
                'kind' => $post->kind,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => (string) $post->excerpt,
                'section' => (string) $post->section,
                'contentHtml' => $packed['html'],
                'contentText' => Text::plainText($packed['html']),
                'coverImage' => $cover !== '' ? $cover : null,
                'coverCaption' => (string) $post->cover_caption,
                'tags' => $post->tags ?? [],
                'author' => $author,
                'outline' => $post->outline ?? [],
                'createdAt' => optional($post->created_at)->toIso8601String(),
                'updatedAt' => optional($post->updated_at)->toIso8601String(),
                'publishedAt' => optional($post->published_at ?? $post->last_published_at)->toIso8601String() ?: now()->toIso8601String(),
                'readingMinutes' => $post->reading_minutes,
                'wordCount' => $post->word_count,
                'featured' => (bool) $post->featured,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public static function envelope(Post $post, string $origin, string $originSystemId, string $originDeskName, Site $target, string $type): array
    {
        $base = [
            'spec' => 'bloghave.v1',
            'type' => $type,
            'originSystemId' => $originSystemId,
            'originDeskName' => $originDeskName,
            'targetSystemId' => $target->system_id,
            'sentAt' => now()->toIso8601String(),
        ];
        if ($type === 'retract') {
            $base['entryId'] = $post->id;

            return $base;
        }
        $packed = self::pack($post, $origin);
        $base['entry'] = $packed['entry'];
        $base['assets'] = $packed['assets'];

        return $base;
    }

    /** @param array<string, mixed> $envelope */
    public static function send(Site $site, array $envelope): array
    {
        if (! $site->ingest_url) {
            return ['ok' => false, 'statusCode' => null, 'message' => 'This desk has no ingest address yet.'];
        }
        if (! $site->outbound_key) {
            return ['ok' => false, 'statusCode' => null, 'message' => 'Add the key this desk expects before sending.'];
        }
        $body = json_encode($envelope, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer '.$site->outbound_key,
            'X-Api-Key' => $site->outbound_key,
        ];
        if ($site->hmac_secret) {
            $headers['X-Bloghave-Signature'] = hash_hmac('sha256', (string) $body, $site->hmac_secret);
        }
        try {
            $response = Http::withHeaders($headers)->timeout(15)->withBody((string) $body, 'application/json')->post($site->ingest_url);
            $text = $response->body();
            $message = mb_substr($text, 0, 400) ?: ($response->successful() ? 'Received.' : 'The other desk refused the piece.');
            $data = json_decode($text, true);
            if (is_array($data)) {
                $message = $data['message'] ?? $data['error'] ?? (($data['ok'] ?? false) ? 'Received.' : $message);
            }

            return ['ok' => $response->successful(), 'statusCode' => $response->status(), 'message' => (string) $message];
        } catch (\Throwable $error) {
            return ['ok' => false, 'statusCode' => null, 'message' => $error->getMessage() ?: 'The other desk could not be reached.'];
        }
    }

    /** @param list<array<string, mixed>>|null $assets */
    public static function saveAssets(?array $assets): array
    {
        $map = [];
        if (! $assets) {
            return $map;
        }
        $dir = public_path('uploads');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        foreach ($assets as $asset) {
            $filename = (string) ($asset['filename'] ?? '');
            $mime = (string) ($asset['mime'] ?? '');
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $ext = $ext !== '' ? '.'.$ext : '';
            if (! isset(self::MIME[$ext]) || self::MIME[$ext] !== $mime) {
                continue;
            }
            $binary = base64_decode((string) ($asset['dataBase64'] ?? ''), true);
            if ($binary === false || $binary === '' || strlen($binary) > 6 * 1024 * 1024) {
                continue;
            }
            $name = now()->timestamp.'-'.Str::substr((string) Str::uuid(), 0, 8).$ext;
            file_put_contents($dir.DIRECTORY_SEPARATOR.$name, $binary);
            $stored = '/uploads/'.$name;
            if (! empty($asset['sourceUrl'])) {
                $map[(string) $asset['sourceUrl']] = $stored;
            }
            if ($filename !== '') {
                $map[$filename] = $stored;
            }
        }

        return $map;
    }

    /** @param array<string, string> $map */
    public static function rewrite(string $value, array $map): string
    {
        $next = $value;
        foreach ($map as $from => $to) {
            if ($from !== '') {
                $next = str_replace($from, $to, $next);
            }
        }

        return $next;
    }

    /** @param list<string> $extras
     * @return array{html: string, assets: list<array<string, string>>}
     */
    private static function collect(string $html, array $extras, string $origin): array
    {
        preg_match_all('/\ssrc="([^"]+)"/', $html, $matches);
        $urls = array_unique(array_merge($matches[1] ?? [], array_filter($extras)));
        $assets = [];
        $map = [];
        foreach ($urls as $url) {
            $relative = str_starts_with($url, $origin) ? substr($url, strlen($origin)) : $url;
            $asset = self::assetFor($relative, $origin);
            if (! $asset) {
                continue;
            }
            $assets[] = $asset;
            $map[$url] = $asset['sourceUrl'];
            if ($relative !== $url) {
                $map[$relative] = $asset['sourceUrl'];
            }
        }
        $next = $html;
        foreach ($map as $from => $to) {
            $next = str_replace($from, $to, $next);
        }

        return ['html' => $next, 'assets' => $assets];
    }

    /** @return array<string, string>|null */
    private static function assetFor(string $urlPath, string $origin): ?array
    {
        if (! str_starts_with($urlPath, '/uploads/')) {
            return null;
        }
        $name = basename($urlPath);
        if ($name === '' || '/uploads/'.$name !== $urlPath) {
            return null;
        }
        $full = public_path('uploads'.DIRECTORY_SEPARATOR.$name);
        $root = realpath(public_path('uploads'));
        $real = realpath($full);
        if (! $root || ! $real || ! str_starts_with($real, $root) || ! is_file($real)) {
            return null;
        }
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $ext = $ext !== '' ? '.'.$ext : '';
        $mime = self::MIME[$ext] ?? null;
        if (! $mime) {
            return null;
        }
        $data = file_get_contents($real);
        if ($data === false || strlen($data) > 6 * 1024 * 1024) {
            return null;
        }

        $asset = [
            'sourceUrl' => $origin.$urlPath,
            'filename' => $name,
            'mime' => $mime,
        ];
        if (strlen($data) <= 256 * 1024) {
            $asset['dataBase64'] = base64_encode($data);
        }

        return $asset;
    }
}
