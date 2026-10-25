<?php

namespace App\Support;

use App\Models\Author;
use App\Models\Delivery as DeliveryRow;
use App\Models\PairingCode;
use App\Models\Post;
use App\Models\Setting;
use App\Models\Site;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class Desk
{
    public static function settings(): Setting
    {
        return Setting::current();
    }

    public static function checkPassword(string $password): bool
    {
        return Hash::check($password, self::settings()->password);
    }

    /** @return list<Post> */
    public static function publicPosts(?string $kind = null): array
    {
        $systemId = self::settings()->system_id;

        return Post::query()->get()
            ->filter(fn (Post $post) => self::isPublic($post, $systemId) && (! $kind || $post->kind === $kind))
            ->sortByDesc(fn (Post $post) => optional($post->published_at ?? $post->updated_at)->timestamp ?? 0)
            ->values()
            ->all();
    }

    public static function findPublic(string $slug, string $kind): ?Post
    {
        $systemId = self::settings()->system_id;

        return collect(self::publicPosts($kind))->first(fn (Post $post) => $post->slug === $slug);
    }

    public static function isPublic(Post $post, string $systemId): bool
    {
        if ($post->status === 'received') {
            return true;
        }

        return $post->status === 'published' && in_array($systemId, $post->published_to ?? [], true);
    }

    public static function createPost(string $kind): Post
    {
        $kind = $kind === 'faq' ? 'faq' : 'article';

        return Post::query()->create([
            'kind' => $kind,
            'title' => '',
            'slug' => self::uniqueSlug($kind === 'faq' ? 'new-question' : 'new-story'),
            'excerpt' => '',
            'section' => '',
            'content_html' => '<p></p>',
            'content_json' => null,
            'cover_image' => '',
            'cover_caption' => '',
            'tags' => [],
            'author' => self::emptyAuthor(),
            'outline' => [],
            'status' => 'draft',
            'published_to' => [],
            'reading_minutes' => 0,
            'featured' => false,
            'word_count' => 0,
        ]);
    }

    /** @param array<string, mixed> $patch */
    public static function savePost(string $id, array $patch, bool $slugEdited): Post
    {
        $post = Post::query()->find($id) ?? throw new DeskException('That piece is not on this desk.', 404);
        self::apply($post, $patch, $slugEdited, false);
        $post->save();

        return $post;
    }

    public static function deletePost(string $id): void
    {
        $deleted = Post::query()->whereKey($id)->delete();
        if (! $deleted) {
            throw new DeskException('That piece is not on this desk.', 404);
        }
    }

    /** @param array<string, mixed> $patch
     * @return array{post: Post, results: list<array{systemId: string, name: string, ok: bool, message: string}>, publicPath: ?string}
     */
    public static function publish(string $id, array $patch, bool $slugEdited, array $systemIds, bool $retract, string $origin): array
    {
        $systemIds = array_values(array_unique(array_filter(array_map(fn ($id) => trim((string) $id), $systemIds))));
        if ($systemIds === []) {
            throw new DeskException('Choose the system id that should receive this.', 400);
        }
        $post = Post::query()->find($id) ?? throw new DeskException('The manuscript is missing.', 400);
        self::apply($post, $patch, $slugEdited, ! $retract);
        $post->save();

        $settings = self::settings();
        $results = [];
        foreach ($systemIds as $systemId) {
            if ($systemId === $settings->system_id) {
                $message = $retract ? 'Taken off this desk.' : 'Published on this desk.';
                $results[] = ['systemId' => $systemId, 'name' => $settings->desk_name, 'ok' => true, 'message' => $message];
                self::record($post, $systemId, $settings->desk_name, $retract ? 'retract' : 'publish', true, 200, $message);
                continue;
            }
            $site = Site::query()->where('system_id', $systemId)->first();
            if (! $site || ! $site->active) {
                $results[] = ['systemId' => $systemId, 'name' => $systemId, 'ok' => false, 'message' => 'That system id is not an active linked desk.'];
                continue;
            }
            $sent = Delivery::send($site, Delivery::envelope($post, $origin, $settings->system_id, $settings->desk_name, $site, $retract ? 'retract' : 'entry'));
            self::record($post, $systemId, $site->name, $retract ? 'retract' : 'publish', $sent['ok'], $sent['statusCode'], $sent['message']);
            $results[] = ['systemId' => $systemId, 'name' => $site->name, 'ok' => $sent['ok'], 'message' => $sent['message']];
        }

        $succeeded = array_values(array_map(fn ($item) => $item['systemId'], array_filter($results, fn ($item) => $item['ok'])));
        self::commit($post, $succeeded, $retract);
        $post->refresh();
        $publicPath = ! $retract && self::isPublic($post, $settings->system_id) ? $post->publicPath() : null;

        return ['post' => $post, 'results' => $results, 'publicPath' => $publicPath];
    }

    /** @param array<string, mixed> $input */
    public static function updateIdentity(array $input): void
    {
        $settings = self::settings();
        if (! empty($input['systemId'])) {
            $systemId = strtolower(trim((string) $input['systemId']));
            if (! Text::isSystemId($systemId)) {
                throw new DeskException('Use a system id of lowercase letters, numbers, and hyphens.');
            }
            if (Site::query()->where('system_id', $systemId)->exists()) {
                throw new DeskException('A linked desk already uses that system id.');
            }
            $previous = $settings->system_id;
            if ($previous !== $systemId) {
                Post::query()->get()->each(function (Post $post) use ($previous, $systemId) {
                    $post->published_to = array_map(fn ($id) => $id === $previous ? $systemId : $id, $post->published_to ?? []);
                    $post->save();
                });
                $settings->system_id = $systemId;
            }
        }
        if (! empty($input['deskName'])) {
            $settings->desk_name = mb_substr(trim((string) $input['deskName']), 0, 80);
        }
        if (array_key_exists('deskLine', $input)) {
            $settings->desk_line = mb_substr(trim((string) $input['deskLine']), 0, 140);
        }
        $settings->save();
    }

    public static function changePassword(string $current, string $next): void
    {
        $settings = self::settings();
        if (! Hash::check($current, $settings->password)) {
            throw new DeskException('The current password is wrong.', 401);
        }
        if (mb_strlen($next) < 8) {
            throw new DeskException('Use at least 8 characters.');
        }
        $settings->password = Hash::make($next);
        $settings->password_changed = true;
        $settings->save();
    }

    public static function createPairingCode(): PairingCode
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = 'BH-';
        for ($i = 0; $i < 8; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        PairingCode::query()
            ->whereNull('used_at')
            ->where('expires_at', '<', now())
            ->delete();

        return PairingCode::query()->create([
            'code' => $code,
            'expires_at' => now()->addDay(),
            'created_at' => now(),
        ]);
    }

    public static function consumePairingCode(string $code, string $usedBy): void
    {
        $row = PairingCode::query()->whereRaw('lower(code) = ?', [strtolower(trim($code))])->first();
        if (! $row) {
            throw new DeskException('That pairing code is not on this desk.', 404);
        }
        if ($row->used_at) {
            throw new DeskException('That pairing code has already been used.');
        }
        if ($row->expires_at->isPast()) {
            throw new DeskException('That pairing code has expired.');
        }
        $row->used_at = now();
        $row->used_by = mb_substr($usedBy, 0, 80);
        $row->save();
    }

    /** @param array<string, mixed> $input */
    public static function createSite(array $input): Site
    {
        $systemId = strtolower(trim((string) ($input['systemId'] ?? '')));
        if (! Text::isSystemId($systemId)) {
            throw new DeskException('Use a system id of lowercase letters, numbers, and hyphens.');
        }
        if ($systemId === self::settings()->system_id) {
            throw new DeskException('That id belongs to this desk.');
        }
        if (Site::query()->where('system_id', $systemId)->exists()) {
            throw new DeskException('A desk with that system id is already linked.');
        }
        $ingest = trim((string) ($input['ingestUrl'] ?? ''));
        if ($ingest !== '' && ! preg_match('/^https?:\/\//i', $ingest)) {
            throw new DeskException('The ingest address must start with http:// or https://.');
        }

        return Site::query()->create([
            'system_id' => $systemId,
            'name' => mb_substr(trim((string) ($input['name'] ?? '')) ?: $systemId, 0, 80),
            'ingest_url' => $ingest,
            'outbound_key' => trim((string) ($input['outboundKey'] ?? '')),
            'inbound_key' => trim((string) ($input['inboundKey'] ?? '')),
            'hmac_secret' => trim((string) ($input['hmacSecret'] ?? '')),
            'require_signature' => (bool) ($input['requireSignature'] ?? false),
            'notes' => mb_substr(trim((string) ($input['notes'] ?? '')), 0, 400),
            'active' => true,
            'last_test_message' => '',
        ]);
    }

    /** @param array<string, mixed> $patch */
    public static function patchSite(string $id, array $patch): Site
    {
        $site = Site::query()->find($id) ?? throw new DeskException('That linked desk is gone.', 404);
        if (isset($patch['name'])) {
            $site->name = mb_substr(trim((string) $patch['name']), 0, 80) ?: $site->name;
        }
        if (isset($patch['ingestUrl'])) {
            $ingest = trim((string) $patch['ingestUrl']);
            if ($ingest !== '' && ! preg_match('/^https?:\/\//i', $ingest)) {
                throw new DeskException('The ingest address must start with http:// or https://.');
            }
            $site->ingest_url = $ingest;
        }
        if (isset($patch['outboundKey'])) {
            $site->outbound_key = trim((string) $patch['outboundKey']);
        }
        if (isset($patch['notes'])) {
            $site->notes = mb_substr(trim((string) $patch['notes']), 0, 400);
        }
        if (array_key_exists('requireSignature', $patch)) {
            $site->require_signature = (bool) $patch['requireSignature'];
        }
        if (isset($patch['hmacSecret'])) {
            $site->hmac_secret = trim((string) $patch['hmacSecret']);
        }
        if (array_key_exists('active', $patch)) {
            $site->active = (bool) $patch['active'];
        }
        $site->save();

        return $site;
    }

    public static function removeSite(string $id): void
    {
        if (! Site::query()->whereKey($id)->delete()) {
            throw new DeskException('That linked desk is gone.', 404);
        }
    }

    public static function ping(Site $site): Site
    {
        $settings = self::settings();
        $envelope = [
            'spec' => 'bloghave.v1',
            'type' => 'ping',
            'originSystemId' => $settings->system_id,
            'originDeskName' => $settings->desk_name,
            'targetSystemId' => $site->system_id,
            'sentAt' => now()->toIso8601String(),
        ];
        $sent = Delivery::send($site, $envelope);
        $site->last_tested_at = now();
        $site->last_test_ok = $sent['ok'];
        $site->last_test_message = mb_substr($sent['message'], 0, 400);
        $site->save();

        return $site;
    }

    /** @param array<string, mixed> $body */
    public static function link(string $remote, string $pairingCode, string $origin): Site
    {
        $remote = rtrim(trim($remote), '/');
        if (! preg_match('/^https?:\/\//i', $remote)) {
            throw new DeskException('Enter the other desk’s address, including http:// or https://.');
        }
        $settings = self::settings();
        $inboundKey = Text::secret('bh');
        $hmacSecret = Text::secret('bhsec');
        try {
            $response = Http::timeout(15)->acceptJson()->post($remote.'/api/v1/handshake', [
                'pairingCode' => $pairingCode,
                'systemId' => $settings->system_id,
                'name' => $settings->desk_name,
                'ingestUrl' => $origin.'/api/v1/ingest',
                'acceptKey' => $inboundKey,
                'hmacSecret' => $hmacSecret,
            ]);
        } catch (\Throwable $error) {
            throw new DeskException($error->getMessage() ?: 'The other desk could not be reached.');
        }
        $data = $response->json();
        if (! is_array($data) || ! $response->successful() || empty($data['ok']) || empty($data['systemId']) || empty($data['apiKey']) || empty($data['ingestUrl'])) {
            throw new DeskException(is_array($data) ? ($data['error'] ?? 'The other desk did not accept the pairing code.') : 'The other desk did not accept the pairing code.');
        }

        return self::createSite([
            'systemId' => $data['systemId'],
            'name' => $data['deskName'] ?? $data['systemId'],
            'ingestUrl' => $data['ingestUrl'],
            'outboundKey' => $data['apiKey'],
            'inboundKey' => $inboundKey,
            'hmacSecret' => $data['hmacSecret'] ?? $hmacSecret,
            'requireSignature' => true,
            'notes' => 'Paired with a code.',
        ]);
    }

    public static function findByInboundKey(string $key): ?Site
    {
        if ($key === '') {
            return null;
        }
        foreach (Site::query()->where('active', true)->get() as $site) {
            $stored = (string) $site->inbound_key;
            if ($stored !== '' && hash_equals($stored, $key)) {
                return $site;
            }
        }

        return null;
    }

    /** @return list<Post> */
    public static function postsForSystem(string $systemId): array
    {
        return Post::query()->where('status', 'published')->get()
            ->filter(fn (Post $post) => in_array($systemId, $post->published_to ?? [], true))
            ->values()
            ->all();
    }

    /** @param array<string, mixed> $input */
    public static function upsertReceived(array $input): Post
    {
        $post = Post::query()
            ->where('source_system_id', $input['originSystemId'])
            ->where('source_post_id', $input['entryId'])
            ->first();
        $html = Html::clean((string) $input['contentHtml']);
        $words = Text::countWords($html);
        if (! $post) {
            $post = new Post([
                'kind' => $input['kind'],
                'slug' => self::uniqueSlug((string) ($input['slug'] ?: $input['title'] ?: 'arrived')),
                'status' => 'received',
                'published_to' => [],
                'source_system_id' => $input['originSystemId'],
                'source_post_id' => $input['entryId'],
            ]);
            $post->id = (string) Str::uuid();
            $post->created_at = ! empty($input['createdAt']) ? $input['createdAt'] : now();
            $post->received_at = now();
        }
        $post->kind = $input['kind'];
        $post->title = mb_substr((string) $input['title'], 0, 180);
        $post->excerpt = mb_substr((string) ($input['excerpt'] ?? ''), 0, 400);
        $post->section = mb_substr((string) ($input['section'] ?? ''), 0, 60);
        $post->content_html = $html;
        $post->cover_image = (string) ($input['coverImage'] ?? '');
        $post->cover_caption = mb_substr((string) ($input['coverCaption'] ?? ''), 0, 180);
        $post->tags = array_slice($input['tags'] ?? [], 0, 12);
        $post->author = self::cleanAuthor($input['author'] ?? []);
        $post->outline = Text::outlineFromHtml($html);
        $post->word_count = $words;
        $post->reading_minutes = Text::readingMinutes($words);
        $post->featured = (bool) ($input['featured'] ?? false);
        if (! empty($input['createdAt'])) {
            $post->created_at = $input['createdAt'];
        }
        $post->published_at = $input['publishedAt'] ?? $post->published_at;
        $post->last_published_at = $post->published_at;
        $post->status = 'received';
        $post->source_desk_name = $input['originDeskName'] ?? $post->source_desk_name;
        if (! $post->slug) {
            $post->slug = self::uniqueSlug((string) ($input['slug'] ?: $input['title']), $post->id);
        }
        $post->save();

        return $post;
    }

    public static function retractReceived(string $originSystemId, string $entryId): bool
    {
        $post = Post::query()->where('source_system_id', $originSystemId)->where('source_post_id', $entryId)->first();
        if (! $post) {
            return false;
        }
        $post->status = 'retracted';
        $post->save();

        return true;
    }

    public static function rememberAuthor(array $author): void
    {
        $name = trim((string) ($author['name'] ?? ''));
        if ($name === '') {
            return;
        }
        $email = (string) ($author['email'] ?? '');
        $existing = Author::query()->get()->first(fn (Author $row) => strcasecmp($row->name, $name) === 0 && $row->email === $email);
        if ($existing) {
            $existing->fill([
                'name' => $name,
                'role' => $author['role'] ?? '',
                'email' => $email,
                'bio' => $author['bio'] ?? '',
                'avatar_url' => $author['avatarUrl'] ?? '',
            ])->save();

            return;
        }
        Author::query()->create([
            'name' => mb_substr($name, 0, 80),
            'role' => mb_substr((string) ($author['role'] ?? ''), 0, 80),
            'email' => mb_substr($email, 0, 120),
            'bio' => mb_substr((string) ($author['bio'] ?? ''), 0, 400),
            'avatar_url' => mb_substr((string) ($author['avatarUrl'] ?? ''), 0, 400),
        ]);
    }

    /** @return array<string, mixed> */
    public static function present(Post $post): array
    {
        return [
            'id' => $post->id,
            'kind' => $post->kind,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => (string) $post->excerpt,
            'section' => (string) $post->section,
            'contentHtml' => (string) $post->content_html,
            'contentJson' => $post->content_json,
            'coverImage' => (string) $post->cover_image,
            'coverCaption' => (string) $post->cover_caption,
            'tags' => $post->tags ?? [],
            'author' => $post->author ?: self::emptyAuthor(),
            'outline' => $post->outline ?? [],
            'status' => $post->status,
            'createdAt' => optional($post->created_at)->toIso8601String(),
            'updatedAt' => optional($post->updated_at)->toIso8601String(),
            'publishedAt' => optional($post->published_at)->toIso8601String(),
            'publishedTo' => $post->published_to ?? [],
            'readingMinutes' => $post->reading_minutes,
            'wordCount' => $post->word_count,
            'featured' => (bool) $post->featured,
            'sourceDeskName' => $post->source_desk_name,
        ];
    }

    /** @param array<string, mixed> $patch */
    private static function apply(Post $post, array $patch, bool $slugEdited, bool $publishing): void
    {
        $previousTitle = (string) $post->title;
        $title = mb_substr(trim((string) ($patch['title'] ?? $post->title)), 0, 180);
        $html = mb_substr(Html::clean((string) ($patch['contentHtml'] ?? $post->content_html)), 0, 500000);
        $words = Text::countWords($html);
        $tags = array_slice(array_values(array_filter(array_map(
            fn ($tag) => mb_substr(trim((string) $tag), 0, 32),
            $patch['tags'] ?? ($post->tags ?? [])
        ))), 0, 12);
        $kind = ($patch['kind'] ?? $post->kind) === 'faq' ? 'faq' : 'article';
        $post->fill([
            'kind' => $kind,
            'title' => $title,
            'excerpt' => mb_substr(trim((string) ($patch['excerpt'] ?? $post->excerpt)), 0, 400),
            'section' => mb_substr(trim((string) ($patch['section'] ?? $post->section)), 0, 60),
            'content_html' => $html,
            'content_json' => array_key_exists('contentJson', $patch) ? $patch['contentJson'] : $post->content_json,
            'cover_image' => mb_substr(trim((string) ($patch['coverImage'] ?? $post->cover_image)), 0, 400),
            'cover_caption' => mb_substr(trim((string) ($patch['coverCaption'] ?? $post->cover_caption)), 0, 180),
            'tags' => $tags,
            'author' => isset($patch['author']) ? self::cleanAuthor($patch['author']) : ($post->author ?: self::emptyAuthor()),
            'outline' => Text::outlineFromHtml($html),
            'featured' => array_key_exists('featured', $patch) ? (bool) $patch['featured'] : $post->featured,
            'word_count' => $words,
            'reading_minutes' => Text::readingMinutes($words),
        ]);
        $requested = trim((string) ($patch['slug'] ?? ''));
        if ($slugEdited && $requested !== '') {
            $post->slug = self::uniqueSlug($requested, $post->id);
        } elseif ($publishing && $title === '') {
            throw new DeskException('Give the piece a headline before you send it.');
        } elseif ($previousTitle === '' && $title !== '') {
            $post->slug = self::uniqueSlug(Text::slugify($title), $post->id);
        }
        if ($publishing) {
            if ($post->title === '') {
                throw new DeskException('Give the piece a headline before you send it.');
            }
            if (trim((string) ($post->author['name'] ?? '')) === '') {
                throw new DeskException('Sign it with the writer’s name before you send it.');
            }
            if ($words < 1) {
                throw new DeskException($post->kind === 'faq' ? 'Write the answer before you send it.' : 'Write the body before you send it.');
            }
            if ($post->kind === 'faq' && $post->section === '') {
                throw new DeskException('Give the question a category before you send it.');
            }
            self::rememberAuthor($post->author ?? []);
        }
    }

    /** @param list<string> $systemIds */
    private static function commit(Post $post, array $systemIds, bool $retract): void
    {
        $targets = array_values(array_unique($systemIds));
        $publishedTo = $post->published_to ?? [];
        if ($retract) {
            $post->published_to = array_values(array_filter($publishedTo, fn ($id) => ! in_array($id, $targets, true)));
            if ($post->status !== 'received' && $post->published_to === []) {
                $post->status = 'draft';
            }
            $post->save();

            return;
        }
        foreach ($targets as $id) {
            if (! in_array($id, $publishedTo, true)) {
                $publishedTo[] = $id;
            }
        }
        $post->published_to = $publishedTo;
        if (! $post->published_at) {
            $post->published_at = now();
        }
        $post->last_published_at = now();
        if ($post->status !== 'received') {
            $post->status = 'published';
        }
        $post->save();
    }

    private static function record(Post $post, string $systemId, string $siteName, string $action, bool $ok, ?int $status, string $message): void
    {
        DeliveryRow::query()->create([
            'post_id' => $post->id,
            'post_title' => $post->title ?: 'Untitled',
            'system_id' => $systemId,
            'site_name' => $siteName,
            'action' => $action,
            'ok' => $ok,
            'status_code' => $status,
            'message' => $message,
            'created_at' => now(),
        ]);
        if (DeliveryRow::query()->count() > 300) {
            $keep = DeliveryRow::query()->orderByDesc('created_at')->limit(300)->pluck('id');
            DeliveryRow::query()->whereNotIn('id', $keep)->delete();
        }
    }

    /** @param array<string, mixed> $input */
    private static function cleanAuthor(array $input): array
    {
        return [
            'name' => mb_substr(trim((string) ($input['name'] ?? '')), 0, 80),
            'role' => mb_substr(trim((string) ($input['role'] ?? '')), 0, 80),
            'email' => mb_substr(trim((string) ($input['email'] ?? '')), 0, 120),
            'bio' => mb_substr(trim((string) ($input['bio'] ?? '')), 0, 400),
            'avatarUrl' => mb_substr(trim((string) ($input['avatarUrl'] ?? '')), 0, 400),
        ];
    }

    /** @return array{name: string, role: string, email: string, bio: string, avatarUrl: string} */
    private static function emptyAuthor(): array
    {
        return ['name' => '', 'role' => '', 'email' => '', 'bio' => '', 'avatarUrl' => ''];
    }

    private static function uniqueSlug(string $slug, ?string $ignoreId = null): string
    {
        $base = Text::slugify($slug);
        $next = $base;
        $n = 2;
        while (Post::query()->where('slug', $next)->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))->exists()) {
            $next = $base.'-'.$n;
            $n++;
        }

        return $next;
    }
}
