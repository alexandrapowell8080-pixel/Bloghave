<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class Html
{
    /** @var list<string> */
    private const ALLOWED = [
        'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i', 'h2', 'h3', 'h4',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'mark', 'sub', 'sup',
        'figure', 'figcaption', 'div', 'label', 'input',
    ];

    public static function clean(?string $html): string
    {
        $html = trim((string) $html);
        if ($html === '') {
            return '';
        }

        $doc = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"><div id="bh-root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $doc->getElementById('bh-root');
        if (! $root) {
            return '';
        }

        self::scrub($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }

        return $out;
    }

    private static function scrub(DOMNode $node): void
    {
        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }
        foreach ($children as $child) {
            self::scrub($child);
        }

        if (! $node instanceof DOMElement) {
            return;
        }

        $tag = strtolower($node->nodeName);
        if ($tag === 'div' && $node->getAttribute('id') === 'bh-root') {
            return;
        }

        if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'link', 'meta'], true)) {
            $node->parentNode?->removeChild($node);

            return;
        }

        if (! in_array($tag, self::ALLOWED, true)) {
            $parent = $node->parentNode;
            if (! $parent) {
                return;
            }
            while ($node->firstChild) {
                $parent->insertBefore($node->firstChild, $node);
            }
            $parent->removeChild($node);

            return;
        }

        self::filterAttributes($node);
    }

    private static function filterAttributes(DOMElement $node): void
    {
        $tag = strtolower($node->nodeName);
        $keep = ['style', 'id', 'class', 'data-type', 'data-checked', 'colspan', 'rowspan'];
        if ($tag === 'a') {
            $keep = array_merge($keep, ['href', 'target', 'rel', 'name']);
        }
        if ($tag === 'img') {
            $keep = array_merge($keep, ['src', 'alt', 'title', 'width', 'height']);
        }
        if ($tag === 'input') {
            $keep = array_merge($keep, ['type', 'checked', 'disabled']);
        }

        $remove = [];
        foreach ($node->attributes ?? [] as $attribute) {
            if (! in_array(strtolower($attribute->name), $keep, true)) {
                $remove[] = $attribute->name;
            }
        }
        foreach ($remove as $name) {
            $node->removeAttribute($name);
        }

        foreach (['href', 'src'] as $urlAttr) {
            if (! $node->hasAttribute($urlAttr)) {
                continue;
            }
            if (! self::safeUrl($node->getAttribute($urlAttr))) {
                $node->removeAttribute($urlAttr);
            }
        }

        if ($node->hasAttribute('style')) {
            $style = self::safeStyle($node->getAttribute('style'));
            if ($style === '') {
                $node->removeAttribute('style');
            } else {
                $node->setAttribute('style', $style);
            }
        }

        if ($tag === 'a' && $node->hasAttribute('href')) {
            $node->setAttribute('rel', 'noopener noreferrer');
            if (! $node->getAttribute('target')) {
                $node->setAttribute('target', '_blank');
            }
        }

        if ($tag === 'input') {
            $type = strtolower($node->getAttribute('type'));
            if ($type !== 'checkbox') {
                $node->setAttribute('type', 'checkbox');
            }
            $node->setAttribute('disabled', 'disabled');
        }
    }

    private static function safeUrl(string $value): bool
    {
        $value = trim($value);
        if ($value === '' || str_starts_with($value, '/') || str_starts_with($value, '#')) {
            return ! str_starts_with(strtolower($value), '//');
        }

        return (bool) preg_match('/^(https?:|mailto:|data:image\/(png|jpeg|gif|webp);base64,)/i', $value);
    }

    private static function safeStyle(string $style): string
    {
        $kept = [];
        foreach (explode(';', $style) as $part) {
            if (! str_contains($part, ':')) {
                continue;
            }
            [$property, $value] = array_map('trim', explode(':', $part, 2));
            $property = strtolower($property);
            $ok = match ($property) {
                'text-align' => (bool) preg_match('/^(left|right|center|justify)$/', $value),
                'color' => (bool) preg_match('/^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/', $value),
                'background-color' => (bool) preg_match('/^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\))$/', $value),
                'width' => (bool) preg_match('/^\d+(?:px|%)$/', $value),
                default => false,
            };
            if ($ok) {
                $kept[] = $property.': '.$value;
            }
        }

        return implode('; ', $kept);
    }
}
