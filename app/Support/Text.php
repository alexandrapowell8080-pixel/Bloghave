<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;
use Normalizer;

class Text
{
    public static function slugify(string $input): string
    {
        $s = mb_strtolower($input);
        if (class_exists(Normalizer::class)) {
            $s = Normalizer::normalize($s, Normalizer::FORM_KD) ?: $s;
            $s = preg_replace('/\p{M}/u', '', $s) ?? $s;
        }
        $s = str_replace('&', ' and ', $s);
        $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
        $s = trim($s, '-');
        $s = mb_substr($s, 0, 80);

        return $s !== '' ? $s : 'piece';
    }

    public static function plainText(string $html): string
    {
        $text = preg_replace('/<[^>]+>/', ' ', $html) ?? '';
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? '';

        return trim($text);
    }

    public static function countWords(string $html): int
    {
        $text = self::plainText($html);
        if ($text === '') {
            return 0;
        }

        return count(array_filter(explode(' ', $text), fn ($word) => $word !== ''));
    }

    public static function readingMinutes(int $words): int
    {
        if ($words < 1) {
            return 0;
        }

        return max(1, (int) round($words / 220));
    }

    /** @return array<int, array{id: string, level: int, text: string}> */
    public static function outlineFromHtml(string $html): array
    {
        preg_match_all('/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/i', $html, $matches, PREG_SET_ORDER);
        $items = [];
        $used = [];
        foreach ($matches as $match) {
            $text = self::plainText($match[2]);
            if ($text === '') {
                continue;
            }
            $base = self::slugify($text);
            $n = $used[$base] ?? 0;
            $used[$base] = $n + 1;
            $items[] = [
                'id' => $n === 0 ? $base : $base.'-'.($n + 1),
                'level' => (int) $match[1],
                'text' => $text,
            ];
        }

        return $items;
    }

    /** @param array<int, array{id: string}> $outline */
    public static function stampHeadingIds(string $html, array $outline): string
    {
        $index = 0;

        return preg_replace_callback('/<h([2-4])\b([^>]*)>/i', function ($match) use (&$index, $outline) {
            $id = $outline[$index]['id'] ?? 'section-'.($index + 1);
            $index++;
            $attrs = preg_replace('/\sid=(["\']).*?\1/i', '', $match[2]) ?? '';

            return '<h'.$match[1].$attrs.' id="'.e($id).'">';
        }, $html) ?? $html;
    }

    public static function formatStamp(DateTimeInterface|string|null $value): string
    {
        if (! $value) {
            return '';
        }
        $date = $value instanceof DateTimeInterface ? Carbon::instance(\DateTime::createFromInterface($value)) : Carbon::parse($value);
        $fmt = new \IntlDateFormatter('en_GB', \IntlDateFormatter::NONE, \IntlDateFormatter::NONE, $date->timezoneName, \IntlDateFormatter::GREGORIAN, 'd MMM y, HH:mm');

        return (string) $fmt->format($date);
    }

    public static function formatDay(DateTimeInterface|string|null $value): string
    {
        if (! $value) {
            return '';
        }
        $date = $value instanceof DateTimeInterface ? Carbon::instance(\DateTime::createFromInterface($value)) : Carbon::parse($value);
        $fmt = new \IntlDateFormatter('en_GB', \IntlDateFormatter::NONE, \IntlDateFormatter::NONE, $date->timezoneName, \IntlDateFormatter::GREGORIAN, 'd MMMM y');

        return (string) $fmt->format($date);
    }

    public static function hueFrom(string $seed): int
    {
        $hash = 0;
        $length = strlen($seed);
        for ($i = 0; $i < $length; $i++) {
            $hash = ($hash * 31 + ord($seed[$i])) & 0xFFFFFFFF;
        }

        return 12 + ($hash % 28);
    }

    public static function isSystemId(string $value): bool
    {
        return (bool) preg_match('/^[a-z][a-z0-9-]{1,38}[a-z0-9]$/', $value);
    }

    public static function secret(string $prefix = 'bh'): string
    {
        return $prefix.'_'.rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    }
}
