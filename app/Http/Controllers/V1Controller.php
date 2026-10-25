<?php

namespace App\Http\Controllers;

use App\Support\Delivery;
use App\Support\Desk;
use App\Support\DeskException;
use App\Support\Html;
use App\Support\Text;
use Illuminate\Http\Request;

class V1Controller extends Controller
{
    public function ingest(Request $request)
    {
        $raw = $request->getContent();
        $site = Desk::findByInboundKey($this->bearer($request));
        if (! $site) {
            return $this->fail('The API key was not recognised.', 401);
        }
        if ($site->require_signature) {
            $provided = (string) $request->header('X-Bloghave-Signature', '');
            $expected = hash_hmac('sha256', $raw, (string) $site->hmac_secret);
            if ($provided === '' || ! hash_equals($expected, $provided)) {
                return $this->fail('The signature did not match.', 401);
            }
        }
        $body = json_decode($raw, true);
        if (! is_array($body)) {
            return $this->fail('The envelope was not JSON.', 400);
        }
        if (($body['spec'] ?? '') !== 'bloghave.v1') {
            return $this->fail('This desk speaks bloghave.v1.', 400);
        }
        $settings = Desk::settings();
        $origin = (string) ($body['originSystemId'] ?? '');
        if ($origin !== $site->system_id && $origin !== $settings->system_id) {
            return $this->fail('That system id does not match the key.', 401);
        }
        if (($body['type'] ?? '') === 'ping') {
            return $this->ok([
                'spec' => 'bloghave.v1',
                'systemId' => $settings->system_id,
                'deskName' => $settings->desk_name,
                'message' => 'This desk is listening.',
            ]);
        }
        if ($origin === $settings->system_id) {
            return $this->ok(['echo' => true, 'message' => 'This desk already holds the manuscript.']);
        }
        if (($body['type'] ?? '') === 'retract') {
            $removed = Desk::retractReceived($origin, (string) ($body['entryId'] ?? ''));

            return $this->ok(['removed' => $removed, 'message' => $removed ? 'The piece was taken down.' : 'This desk had no copy to take down.']);
        }
        $entry = $body['entry'] ?? null;
        if (($body['type'] ?? '') !== 'entry' || ! is_array($entry)) {
            return $this->fail('The envelope had no piece.', 400);
        }
        if (trim((string) ($entry['title'] ?? '')) === '') {
            return $this->fail('The piece needs a headline.', 400);
        }
        if (trim((string) ($entry['author']['name'] ?? '')) === '') {
            return $this->fail('The piece needs the writer’s name.', 400);
        }
        $map = Delivery::saveAssets($body['assets'] ?? []);
        $html = Html::clean(Delivery::rewrite((string) ($entry['contentHtml'] ?? ''), $map));
        if (trim(strip_tags($html)) === '') {
            return $this->fail('The piece had no body.', 400);
        }
        $author = is_array($entry['author'] ?? null) ? $entry['author'] : [];
        $author['avatarUrl'] = Delivery::rewrite((string) ($author['avatarUrl'] ?? ''), $map);
        $post = Desk::upsertReceived([
            'originSystemId' => $origin,
            'originDeskName' => $body['originDeskName'] ?? $site->name,
            'entryId' => (string) ($entry['id'] ?? ''),
            'kind' => ($entry['kind'] ?? '') === 'faq' ? 'faq' : 'article',
            'title' => trim((string) $entry['title']),
            'slug' => $entry['slug'] ?? $entry['title'],
            'excerpt' => $entry['excerpt'] ?? '',
            'section' => $entry['section'] ?? '',
            'contentHtml' => $html,
            'coverImage' => Delivery::rewrite((string) ($entry['coverImage'] ?? ''), $map),
            'coverCaption' => $entry['coverCaption'] ?? '',
            'tags' => $entry['tags'] ?? [],
            'author' => $author,
            'createdAt' => $entry['createdAt'] ?? ($body['sentAt'] ?? now()->toIso8601String()),
            'publishedAt' => $entry['publishedAt'] ?? ($body['sentAt'] ?? now()->toIso8601String()),
            'featured' => (bool) ($entry['featured'] ?? false),
        ]);

        return $this->ok([
            'id' => $post->id,
            'slug' => $post->slug,
            'url' => $post->publicPath(),
            'message' => 'Received.',
        ]);
    }

    public function handshake(Request $request)
    {
        $body = $request->json()->all();
        if (empty($body['pairingCode'])) {
            return $this->fail('A pairing code is required.', 400);
        }
        if (empty($body['systemId']) || empty($body['ingestUrl']) || empty($body['acceptKey'])) {
            return $this->fail('The other desk did not introduce itself fully.', 400);
        }
        if (! preg_match('/^https?:\/\//i', (string) $body['ingestUrl'])) {
            return $this->fail('The ingest address must be http or https.', 400);
        }
        try {
            Desk::consumePairingCode((string) $body['pairingCode'], (string) $body['systemId']);
            $apiKey = Text::secret('bh');
            $site = Desk::createSite([
                'systemId' => $body['systemId'],
                'name' => $body['name'] ?? $body['systemId'],
                'ingestUrl' => $body['ingestUrl'],
                'outboundKey' => $body['acceptKey'],
                'inboundKey' => $apiKey,
                'hmacSecret' => $body['hmacSecret'] ?? '',
                'requireSignature' => ! empty($body['hmacSecret']),
                'notes' => 'Paired from their desk.',
            ]);
        } catch (DeskException $error) {
            return $this->fail($error->getMessage(), $error->status);
        }
        $settings = Desk::settings();

        return $this->ok([
            'systemId' => $settings->system_id,
            'deskName' => $settings->desk_name,
            'ingestUrl' => rtrim((string) config('bloghave.url'), '/').'/api/v1/ingest',
            'apiKey' => $apiKey,
            'hmacSecret' => $site->hmac_secret,
            'message' => 'The desks are linked.',
        ]);
    }

    public function posts(Request $request)
    {
        $site = Desk::findByInboundKey($this->bearer($request));
        if (! $site) {
            return $this->fail('The API key was not recognised.', 401);
        }
        $since = (string) $request->query('since', '');
        $embed = $request->query('embed') === '1';
        $origin = rtrim((string) config('bloghave.url'), '/');
        $posts = collect(Desk::postsForSystem($site->system_id))
            ->filter(function ($post) use ($since) {
                if ($since === '') {
                    return true;
                }
                $stamp = optional($post->last_published_at ?? $post->published_at)->toIso8601String() ?? '';

                return $stamp > $since;
            })
            ->map(function ($post) use ($origin, $embed) {
                $packed = Delivery::pack($post, $origin);

                return $embed ? ['entry' => $packed['entry'], 'assets' => $packed['assets']] : ['entry' => $packed['entry']];
            })
            ->values();

        return $this->ok([
            'spec' => 'bloghave.v1',
            'systemId' => $site->system_id,
            'posts' => $posts,
        ], false);
    }

    private function bearer(Request $request): string
    {
        $header = (string) $request->header('Authorization', '');
        if (str_starts_with($header, 'Bearer ')) {
            return trim(substr($header, 7));
        }

        return trim((string) $request->header('X-Api-Key', ''));
    }

    /** @param array<string, mixed> $payload */
    private function ok(array $payload, bool $withOk = true)
    {
        if ($withOk) {
            $payload = ['ok' => true] + $payload;
        }

        return response()->json($payload);
    }

    private function fail(string $message, int $status)
    {
        return response()->json(['error' => $message], $status);
    }
}
