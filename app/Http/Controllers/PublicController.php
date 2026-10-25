<?php

namespace App\Http\Controllers;

use App\Support\Desk;
use App\Support\Seo;
use App\Support\Text;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function home()
    {
        $stories = Desk::publicPosts('article');
        $faqs = Desk::publicPosts('faq');
        $featured = collect($stories)->first(fn ($post) => $post->featured) ?? ($stories[0] ?? null);
        $rest = collect($stories)->reject(fn ($post) => $featured && $post->id === $featured->id)->take(3)->values();

        return view('public.home', [
            'stories' => $stories,
            'faqs' => $faqs,
            'featured' => $featured,
            'rest' => $rest,
            'meta' => $this->meta(
                'Bloghave · Articles and FAQs, sent intact',
                Seo::HOME_DESCRIPTION,
                '/',
                ['writing desk', 'publish articles', 'publish FAQs', 'linked desks'],
                true,
                true
            ),
            'crumbs' => [['name' => 'Home', 'path' => '/']],
            'jsonld' => [
                Seo::website(Seo::HOME_DESCRIPTION),
                Seo::organization(Seo::HOME_DESCRIPTION),
                Seo::itemList('Stories', '/blog', collect($stories)->take(12)->map(fn ($post) => [
                    'name' => $post->title,
                    'path' => '/blog/'.$post->slug,
                ])->all()),
            ],
        ]);
    }

    public function blog(Request $request)
    {
        $tag = trim((string) $request->query('tag', ''));
        $stories = collect(Desk::publicPosts('article'))
            ->when($tag !== '', fn ($posts) => $posts->filter(fn ($post) => in_array($tag, $post->tags ?? [], true)))
            ->values();
        $description = 'Read every article published on Bloghave, with the writer, the section, and the dates the desk stamped.';

        return view('public.blog', [
            'stories' => $stories,
            'tag' => $tag,
            'meta' => $this->meta($tag !== '' ? $tag : 'Stories', $description, $tag !== '' ? '/blog?tag='.urlencode($tag) : '/blog', ['stories', 'articles', $tag]),
            'crumbs' => [['name' => 'Home', 'path' => '/'], ['name' => 'Stories', 'path' => '/blog']],
            'jsonld' => [
                Seo::itemList('Stories', '/blog', $stories->map(fn ($post) => ['name' => $post->title, 'path' => '/blog/'.$post->slug])->all()),
            ],
        ]);
    }

    public function story(string $slug)
    {
        $post = Desk::findPublic($slug, 'article');
        abort_unless($post, 404);
        $presented = Desk::present($post);
        $description = Seo::description((string) $post->excerpt, 'An article published on Bloghave.');

        return view('public.story', [
            'post' => $post,
            'html' => Text::stampHeadingIds((string) $post->content_html, $post->outline ?? []),
            'meta' => $this->meta($post->title, $description, '/blog/'.$post->slug, array_filter([$post->section, $post->authorName(), 'article', ...($post->tags ?? [])]), false, false, $post->cover_image, [
                'publishedTime' => optional($post->published_at)->toIso8601String(),
                'modifiedTime' => optional($post->updated_at)->toIso8601String(),
                'authors' => [$post->authorName()],
                'tags' => $post->tags ?? [],
            ]),
            'crumbs' => [
                ['name' => 'Home', 'path' => '/'],
                ['name' => 'Stories', 'path' => '/blog'],
                ['name' => $post->title, 'path' => '/blog/'.$post->slug],
            ],
            'jsonld' => [Seo::article($presented)],
        ]);
    }

    public function faq(Request $request)
    {
        $tag = trim((string) $request->query('tag', ''));
        $questions = collect(Desk::publicPosts('faq'))
            ->when($tag !== '', fn ($posts) => $posts->filter(fn ($post) => in_array($tag, $post->tags ?? [], true) || strcasecmp((string) $post->section, $tag) === 0))
            ->values();
        $description = 'Browse questions on Bloghave. Each FAQ keeps its category, short answer, and the fuller answer as it was written.';

        return view('public.faq', [
            'questions' => $questions,
            'categories' => $questions->pluck('section')->filter()->unique()->values(),
            'tag' => $tag,
            'meta' => $this->meta('FAQs', $description, '/faq', ['FAQ', 'questions', 'answers']),
            'crumbs' => [['name' => 'Home', 'path' => '/'], ['name' => 'FAQs', 'path' => '/faq']],
            'jsonld' => [
                Seo::faqPage($questions->map(fn ($post) => [
                    'title' => $post->title,
                    'answer' => Text::plainText((string) $post->excerpt.' '.(string) $post->content_html),
                ])->all()),
            ],
        ]);
    }

    public function question(string $slug)
    {
        $post = Desk::findPublic($slug, 'faq');
        abort_unless($post, 404);
        $answer = Text::plainText((string) $post->content_html);
        $description = Seo::description('The answer to '.$post->title.', written by '.$post->authorName().' on Bloghave.', 'A question answered on Bloghave.');

        return view('public.question', [
            'post' => $post,
            'html' => Text::stampHeadingIds((string) $post->content_html, $post->outline ?? []),
            'meta' => $this->meta($post->title, $description, '/faq/'.$post->slug, array_filter([$post->section, 'FAQ', $post->authorName()])),
            'crumbs' => [
                ['name' => 'Home', 'path' => '/'],
                ['name' => 'FAQs', 'path' => '/faq'],
                ['name' => $post->title, 'path' => '/faq/'.$post->slug],
            ],
            'jsonld' => [Seo::qaPage([
                'title' => $post->title,
                'slug' => $post->slug,
                'answer' => $answer,
                'publishedAt' => optional($post->published_at)->toIso8601String(),
                'createdAt' => optional($post->created_at)->toIso8601String(),
                'authorName' => $post->authorName(),
            ])],
        ]);
    }

    public function login(Request $request)
    {
        if ($request->session()->get('desk') === true) {
            return redirect('/desk');
        }
        $description = 'Sign in to the Bloghave desk to write, publish, and link other systems.';

        return view('public.login', [
            'next' => $request->query('next', '/desk'),
            'meta' => $this->meta('Sign in', $description, '/login', ['sign in', 'desk'], false),
            'crumbs' => [['name' => 'Home', 'path' => '/'], ['name' => 'Sign in', 'path' => '/login']],
            'jsonld' => [Seo::webPage('Sign in', $description, '/login')],
        ]);
    }

    public function authenticate(Request $request)
    {
        $request->validate(['password' => ['required', 'string']]);
        if (! Desk::checkPassword((string) $request->input('password'))) {
            return back()->withInput()->with('error', 'That password does not open the desk.');
        }
        $request->session()->put('desk', true);
        $next = (string) $request->input('next', '/desk');
        if (! str_starts_with($next, '/') || str_starts_with($next, '//')) {
            $next = '/desk';
        }

        return redirect($next);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('desk');

        return redirect('/');
    }

    public function robots()
    {
        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /desk',
            'Disallow: /admin',
            'Disallow: /login',
            'Disallow: /api',
            '',
            'Sitemap: '.Seo::abs('/sitemap.xml'),
        ];

        return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap()
    {
        $urls = ['/', '/blog', '/faq'];
        foreach (Desk::publicPosts() as $post) {
            $urls[] = $post->publicPath();
        }
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach ($urls as $path) {
            $xml .= '  <url><loc>'.e(Seo::abs($path)).'</loc></url>'."\n";
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    /** @param list<string> $keywords
     * @param array<string, mixed>|null $article
     * @return array<string, mixed>
     */
    private function meta(string $title, string $description, string $path, array $keywords = [], bool $index = true, bool $absolute = false, ?string $image = null, ?array $article = null): array
    {
        return [
            'title' => $title,
            'absolute' => $absolute,
            'description' => $description,
            'path' => $path,
            'keywords' => Seo::keywords($keywords),
            'index' => $index,
            'image' => $image ? Seo::abs($image) : null,
            'article' => $article,
        ];
    }
}
