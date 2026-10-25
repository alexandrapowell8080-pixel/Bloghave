<?php

namespace App\Http\Controllers;

use App\Models\Author;
use App\Models\Delivery;
use App\Models\PairingCode;
use App\Models\Post;
use App\Models\Site;
use App\Support\Desk;
use App\Support\DeskException;
use App\Support\Seo;
use App\Support\Text;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeskController extends Controller
{
    public function library(Request $request)
    {
        $kind = $request->query('kind');
        $status = $request->query('status');
        $posts = Post::query()->orderByDesc('updated_at')->get()->filter(function (Post $post) use ($kind, $status) {
            if ($kind === 'article' || $kind === 'faq') {
                return $post->kind === $kind;
            }
            if ($status) {
                return $post->status === $status;
            }

            return true;
        })->values();
        $description = 'The Bloghave library of drafts, published stories, and questions, ready to edit or send.';

        return view('desk.library', [
            'posts' => $posts,
            'systemId' => Desk::settings()->system_id,
            'current' => $kind ? '/desk?kind='.$kind : ($status ? '/desk?status='.$status : '/desk'),
            'meta' => $this->privateMeta('Library', $description, '/desk', ['library', 'drafts', 'manuscripts']),
            'crumbs' => [['name' => 'Home', 'path' => '/'], ['name' => 'Library', 'path' => '/desk']],
            'jsonld' => [Seo::webPage('Library', $description, '/desk')],
        ]);
    }

    public function create(Request $request)
    {
        $post = Desk::createPost((string) $request->input('kind', 'article'));

        return redirect('/desk/compose/'.$post->id);
    }

    public function destroy(string $id)
    {
        Desk::deletePost($id);

        return redirect('/desk');
    }

    public function compose(string $id)
    {
        $post = Post::query()->find($id);
        abort_unless($post, 404);
        $description = 'Compose a Bloghave article or FAQ, then send it to a linked system id.';
        $path = '/desk/compose/'.$post->id;

        return view('desk.compose', [
            'post' => $post,
            'presented' => Desk::present($post),
            'sites' => Site::query()->orderByDesc('created_at')->get(),
            'authors' => Author::query()->orderByDesc('updated_at')->limit(40)->get(),
            'settings' => Desk::settings(),
            'meta' => $this->privateMeta($post->title ?: 'Compose', $description, $path, ['compose', 'editor']),
            'crumbs' => [
                ['name' => 'Home', 'path' => '/'],
                ['name' => 'Library', 'path' => '/desk'],
                ['name' => $post->title ?: 'Compose', 'path' => $path],
            ],
            'jsonld' => [Seo::webPage('Compose', $description, $path)],
        ]);
    }

    public function save(Request $request, string $id)
    {
        $body = $request->validate([
            'post' => ['required', 'array'],
            'slugEdited' => ['nullable', 'boolean'],
        ]);
        $post = Desk::savePost($id, $body['post'], (bool) ($body['slugEdited'] ?? false));

        return response()->json(['post' => Desk::present($post)]);
    }

    public function publish(Request $request)
    {
        $body = $request->validate([
            'post' => ['required', 'array'],
            'slugEdited' => ['nullable', 'boolean'],
            'systemIds' => ['nullable', 'array'],
            'retract' => ['nullable', 'boolean'],
        ]);
        if (empty($body['post']['id'])) {
            throw new DeskException('The manuscript is missing.');
        }
        $result = Desk::publish(
            (string) $body['post']['id'],
            $body['post'],
            (bool) ($body['slugEdited'] ?? false),
            $body['systemIds'] ?? [],
            (bool) ($body['retract'] ?? false),
            rtrim((string) config('bloghave.url'), '/')
        );

        return response()->json([
            'post' => Desk::present($result['post']),
            'results' => $result['results'],
            'publicPath' => $result['publicPath'],
        ]);
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (! $file) {
            throw new DeskException('Choose an image to upload.');
        }
        $types = ['image/png' => '.png', 'image/jpeg' => '.jpg', 'image/gif' => '.gif', 'image/webp' => '.webp'];
        $ext = $types[$file->getMimeType()] ?? null;
        if (! $ext) {
            throw new DeskException('Use a PNG, JPEG, GIF, or WebP image.');
        }
        if ($file->getSize() > 6 * 1024 * 1024) {
            throw new DeskException('Images need to be under 6 MB.');
        }
        $name = now()->timestamp.'-'.substr((string) Str::uuid(), 0, 8).$ext;
        $file->move(public_path('uploads'), $name);

        return response()->json(['url' => '/uploads/'.$name]);
    }

    public function admin()
    {
        $settings = Desk::settings();
        $description = 'Register linked desks, pairing codes, and the keys Bloghave uses to send and receive pieces.';

        return view('desk.admin', [
            'settings' => $settings,
            'sites' => Site::query()->orderByDesc('created_at')->get(),
            'codes' => PairingCode::query()->orderByDesc('created_at')->limit(8)->get(),
            'deliveries' => Delivery::query()->orderByDesc('created_at')->limit(40)->get(),
            'counts' => [
                'stories' => Post::query()->where('kind', 'article')->count(),
                'questions' => Post::query()->where('kind', 'faq')->count(),
                'drafts' => Post::query()->where('status', 'draft')->count(),
            ],
            'ingest' => rtrim((string) config('bloghave.url'), '/').'/api/v1/ingest',
            'meta' => $this->privateMeta('Desks', $description, '/admin', ['desks', 'API keys', 'pairing']),
            'crumbs' => [['name' => 'Home', 'path' => '/'], ['name' => 'Desks', 'path' => '/admin']],
            'jsonld' => [Seo::webPage('Desks', $description, '/admin')],
        ]);
    }

    public function adminAction(Request $request)
    {
        $action = (string) $request->input('action');
        if ($action === 'identity') {
            Desk::updateIdentity($request->only(['systemId', 'deskName', 'deskLine']));

            return back()->with('notice', 'The desk identity is saved.');
        }
        if ($action === 'password') {
            Desk::changePassword((string) $request->input('current'), (string) $request->input('next'));

            return back()->with('notice', 'The password is changed.');
        }
        if ($action === 'pairing') {
            $code = Desk::createPairingCode();

            return back()->with('notice', 'Pairing code '.$code->code.' is ready for 24 hours.');
        }
        if ($action === 'link') {
            Desk::link((string) $request->input('origin'), (string) $request->input('pairingCode'), rtrim((string) config('bloghave.url'), '/'));

            return back()->with('notice', 'The desks are linked.');
        }
        if ($action === 'site') {
            $site = Desk::createSite([
                'systemId' => $request->input('systemId'),
                'name' => $request->input('name'),
                'ingestUrl' => $request->input('ingestUrl'),
                'outboundKey' => $request->input('outboundKey'),
                'inboundKey' => Text::secret('bh'),
                'hmacSecret' => Text::secret('bhsec'),
                'requireSignature' => $request->boolean('requireSignature'),
                'notes' => $request->input('notes'),
            ]);

            return back()->with('notice', 'Linked '.$site->name.'. Copy its inbound key from the card.');
        }

        throw new DeskException('Unknown desk action.');
    }

    public function siteTest(string $id)
    {
        $site = Site::query()->find($id) ?? throw new DeskException('That linked desk is gone.', 404);
        Desk::ping($site);

        return back()->with('notice', 'The ping was sent.');
    }

    public function siteUpdate(Request $request, string $id)
    {
        Desk::patchSite($id, ['active' => $request->boolean('active')]);

        return back()->with('notice', 'The linked desk is updated.');
    }

    public function siteDelete(string $id)
    {
        Desk::removeSite($id);

        return back()->with('notice', 'The linked desk is removed.');
    }

    /** @param list<string> $keywords
     * @return array<string, mixed>
     */
    private function privateMeta(string $title, string $description, string $path, array $keywords): array
    {
        return [
            'title' => $title,
            'absolute' => false,
            'description' => $description,
            'path' => $path,
            'keywords' => Seo::keywords($keywords),
            'index' => false,
            'image' => null,
            'article' => null,
        ];
    }
}
