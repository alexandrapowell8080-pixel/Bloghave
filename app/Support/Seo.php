<?php

namespace App\Support;

class Seo
{
    public const NAME = 'Bloghave';

    /** @var list<string> */
    public const KEYWORDS = [
        'Bloghave',
        'articles',
        'blog',
        'FAQ',
        'publishing',
        'writer byline',
        'content delivery',
        'Fellohtech',
    ];

    public const HOME_DESCRIPTION = 'Write an article or FAQ once on Bloghave. The edited page, the writer, and both dates arrive intact on every linked desk.';

    public static function origin(): string
    {
        return rtrim((string) config('bloghave.url'), '/');
    }

    public static function abs(string $path = ''): string
    {
        if ($path === '') {
            return self::origin();
        }
        if (preg_match('/^https?:\/\//i', $path)) {
            return $path;
        }

        return self::origin().(str_starts_with($path, '/') ? $path : '/'.$path);
    }

    public static function description(string $text, string $fallback): string
    {
        $clean = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        $source = mb_strlen($clean) >= 40 ? $clean : $fallback;

        return mb_strlen($source) > 160 ? rtrim(mb_substr($source, 0, 157)).'…' : $source;
    }

    /** @param list<array{name: string, path: string}> $crumbs */
    public static function breadcrumb(array $crumbs): array
    {
        $page = self::abs($crumbs[array_key_last($crumbs)]['path'] ?? '/');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            '@id' => $page.'#breadcrumb',
            'itemListElement' => array_values(array_map(fn ($crumb, $index) => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $crumb['name'],
                'item' => self::abs($crumb['path']),
            ], $crumbs, array_keys($crumbs))),
        ];
    }

    public static function website(string $description): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            '@id' => self::origin().'#website',
            'name' => self::NAME,
            'url' => self::origin(),
            'description' => $description,
            'inLanguage' => 'en',
            'publisher' => ['@id' => self::origin().'#organization'],
        ];
    }

    public static function organization(string $description): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => self::origin().'#organization',
            'name' => self::NAME,
            'url' => self::origin(),
            'description' => $description,
            'brand' => ['@type' => 'Brand', 'name' => self::NAME],
            'founder' => ['@type' => 'Organization', 'name' => 'Fellohtech', 'url' => 'https://fellohtech.com'],
        ];
    }

    /** @param list<array{name: string, path: string}> $items */
    public static function itemList(string $name, string $path, array $items): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'ItemList',
            'name' => $name,
            'url' => self::abs($path),
            'itemListElement' => array_values(array_map(fn ($item, $index) => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $item['name'],
                'url' => self::abs($item['path']),
            ], $items, array_keys($items))),
        ];
    }

    public static function webPage(string $title, string $description, string $path): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            '@id' => self::abs($path),
            'name' => $title,
            'description' => $description,
            'url' => self::abs($path),
            'inLanguage' => 'en',
            'isPartOf' => ['@type' => 'WebSite', 'name' => self::NAME, 'url' => self::origin()],
            'breadcrumb' => ['@id' => self::abs($path).'#breadcrumb'],
        ];
    }

    /** @param list<string> $tags */
    public static function article(array $post): array
    {
        $path = '/blog/'.$post['slug'];
        $image = ! empty($post['coverImage']) ? self::abs($post['coverImage']) : null;

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BlogPosting',
            '@id' => self::abs($path).'#article',
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => self::abs($path)],
            'headline' => $post['title'],
            'description' => $post['excerpt'],
            'image' => $image,
            'articleSection' => $post['section'] ?: 'Story',
            'keywords' => implode(', ', $post['tags'] ?? []),
            'wordCount' => $post['wordCount'],
            'inLanguage' => 'en',
            'dateCreated' => $post['createdAt'],
            'datePublished' => $post['publishedAt'] ?: $post['createdAt'],
            'dateModified' => $post['updatedAt'],
            'author' => [
                '@type' => 'Person',
                'name' => $post['author']['name'] ?? '',
                'jobTitle' => ($post['author']['role'] ?? '') ?: null,
                'description' => ($post['author']['bio'] ?? '') ?: null,
            ],
            'publisher' => ['@id' => self::origin().'#organization'],
            'breadcrumb' => ['@id' => self::abs($path).'#breadcrumb'],
        ];
    }

    /** @param list<array{title: string, answer: string}> $questions */
    public static function faqPage(array $questions): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn ($question) => [
                '@type' => 'Question',
                'name' => $question['title'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $question['answer']],
            ], $questions),
        ];
    }

    public static function qaPage(array $post): array
    {
        $path = '/faq/'.$post['slug'];

        return [
            '@context' => 'https://schema.org',
            '@type' => 'QAPage',
            '@id' => self::abs($path),
            'mainEntity' => [
                '@type' => 'Question',
                'name' => $post['title'],
                'answerCount' => 1,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $post['answer'],
                    'datePublished' => $post['publishedAt'] ?: $post['createdAt'],
                    'author' => ['@type' => 'Person', 'name' => $post['authorName']],
                ],
            ],
        ];
    }

    /** @param list<string> $extra */
    public static function keywords(array $extra = []): array
    {
        return array_values(array_unique(array_filter(array_map(
            fn ($item) => trim((string) $item),
            [...$extra, ...self::KEYWORDS]
        ))));
    }
}
