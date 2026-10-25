<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Post;
use App\Models\Setting;
use App\Support\Text;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BloghaveSeeder extends Seeder
{
    public function run(): void
    {
        if (Setting::query()->exists()) {
            return;
        }

        Setting::query()->create([
            'password' => Hash::make('bloghave'),
            'password_changed' => false,
            'system_id' => 'bloghave',
            'desk_name' => 'The house desk',
            'desk_line' => 'Stories and questions, sent intact.',
        ]);

        $imani = [
            'name' => 'Imani Okoye',
            'role' => 'Desk editor',
            'email' => 'imani@bloghave.desk',
            'bio' => 'Keeps the manuscript and the delivery in the same key.',
            'avatarUrl' => '',
        ];
        $jules = [
            'name' => 'Jules Hart',
            'role' => 'Relay',
            'email' => 'jules@bloghave.desk',
            'bio' => 'Links one desk to the next and checks that the page still matches.',
            'avatarUrl' => '',
        ];

        $this->piece('article', 'The page should arrive wearing the same clothes', 'the-page-should-arrive-wearing-the-same-clothes', 'Field notes', 'A headline, a figure, a byline, and two stamps of time. Send them together, or you have not sent the piece.', $imani, ['desk', 'delivery'], true, 26, 20, <<<'HTML'
<p>A story is a set of decisions. The headline. The figure. The pause between two sentences. The name signed underneath. Bloghave treats those decisions as the piece itself.</p>
<p>When you send it, the other desk receives the same decisions. The type stays type. The picture stays where you put it. Nothing is flattened on the way out the door.</p>
<h2>What stays put</h2>
<p>The manuscript on this desk is the manuscript they render. A heading stays a heading. A quote stays a quote. A list stays a list, and a table does not turn into a paragraph of apologies.</p>
<ul>
<li>The figure you placed, with its caption</li>
<li>The byline you signed, including the role and the short life note</li>
<li>The hour the desk created it, and the hour it was sent</li>
</ul>
<blockquote>If the page has to be explained after it arrives, it did not arrive.</blockquote>
<h2>Two shapes</h2>
<p>An article is a long walk. A question is a door. They are edited differently here, and they are filed differently there. Choosing FAQ does not borrow the costume of a feature.</p>
<h3>On the far side</h3>
<p>The receiving desk keeps the shape you chose. Pick the system id, send, and that desk — not a neighbouring one — is where the piece goes.</p>
HTML);
        $this->piece('article', 'A byline is part of the piece', 'a-byline-is-part-of-the-piece', 'The desk', 'The writer’s name is not a footer extra. It travels with the story, the way the date does.', $imani, ['byline'], false, 12, 10, <<<'HTML'
<p>Someone will read this on another site and want to know who set the sentences down. Leave the name, the role, and a line about the writer in the inspector. That block is part of the page, not an afterthought in a database.</p>
<h2>What the other desk shows</h2>
<p>Name, role, and the short bio render under the deck. If you add a portrait, it goes too. The email stays in the payload for the other system and stays off the public page.</p>
<p>Created and published are stamped by the desk. You do not type them. You can trust them because you cannot tidy them.</p>
HTML);
        $this->piece('article', 'Questions are not articles', 'questions-are-not-articles', 'Practice', 'FAQ is its own manuscript: a category, a question, a short answer, then the fuller one.', $jules, ['faq'], false, 6, 5, <<<'HTML'
<p>Open a question and the sheet changes. The headline becomes the question. The deck becomes the short answer. The body is the fuller reply a reader can open.</p>
<h2>Why the split matters</h2>
<p>A feature wants a figure and a long walk. A question wants a category and a door that opens onto an answer. Sending both through one anonymous template is how pages start lying.</p>
<p>On the far side, kind is part of the payload. A Bloghave desk files it accordingly. Another site can do the same, because the shape is labelled, not guessed.</p>
HTML);
        $this->piece('faq', 'How does a story reach another site?', 'how-does-a-story-reach-another-site', 'Linking', 'Register the desk, keep its system id, and choose that id when you send.', $jules, ['api', 'desks'], false, 18, 18, <<<'HTML'
<p>Each linked site has a system id, an ingest address, and a key. In Desks, register it — or pair with a code if the other side is Bloghave too.</p>
<h2>The moment of sending</h2>
<p>In the manuscript, choose that system id. Publish posts the piece to its ingest address with the key. The HTML, the images, the byline, and both dates go in the same envelope.</p>
<p>If you choose this desk’s own id, the story is published here. If you choose another, it goes there. You can send it again later to a second id.</p>
HTML);
        $this->piece('faq', 'What travels with the piece?', 'what-travels-with-the-piece', 'Delivery', 'The edited page: type, pictures, outline, writer, and the stamps of time.', $jules, ['payload'], false, 16, 16, <<<'HTML'
<p>The envelope is <code>bloghave.v1</code>. It carries the kind (article or FAQ), title, deck, HTML, outline, tags, cover, and every inline image as bytes so the other desk can keep its own copies.</p>
<h2>The writer and the clock</h2>
<ul>
<li>Author name, role, bio, and portrait</li>
<li>Created time, set when the manuscript was opened</li>
<li>Published time, set when you send</li>
</ul>
<p>The other desk is meant to render that HTML with the same care. This one does.</p>
HTML);
        $this->piece('faq', 'Can the other site send stories back?', 'can-the-other-site-send-stories-back', 'Linking', 'Yes. Give them your ingest address and the inbound key, or pair the two desks.', $imani, ['api'], false, 8, 8, <<<'HTML'
<p>Linking is two directions. You can push to their ingest, and they can push to yours. A pairing code does both at once when the other desk runs Bloghave.</p>
<h2>What arrives here</h2>
<p>An inbound story is stored as it was sent and filed by its kind. Articles join the stories. Questions join the FAQ. The byline and the original dates stay as the writer left them.</p>
<p>You will see “Arrived from” and their desk name on the page.</p>
HTML);

        foreach ([$imani, $jules] as $author) {
            Author::query()->create([
                'name' => $author['name'],
                'role' => $author['role'],
                'email' => $author['email'],
                'bio' => $author['bio'],
                'avatar_url' => '',
            ]);
        }
    }

    /** @param array{name: string, role: string, email: string, bio: string, avatarUrl: string} $author
     * @param list<string> $tags
     */
    private function piece(string $kind, string $title, string $slug, string $section, string $excerpt, array $author, array $tags, bool $featured, int $createdHours, int $publishedHours, string $html): void
    {
        $html = trim($html);
        $words = Text::countWords($html);
        $created = now()->subHours($createdHours);
        $published = now()->subHours($publishedHours);
        $post = new Post([
            'kind' => $kind,
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $excerpt,
            'section' => $section,
            'content_html' => $html,
            'cover_image' => '',
            'cover_caption' => '',
            'tags' => $tags,
            'author' => $author,
            'outline' => Text::outlineFromHtml($html),
            'status' => 'published',
            'published_at' => $published,
            'last_published_at' => $published,
            'published_to' => ['bloghave'],
            'reading_minutes' => Text::readingMinutes($words),
            'featured' => $featured,
            'word_count' => $words,
        ]);
        $post->id = (string) Str::uuid();
        $post->created_at = $created;
        $post->updated_at = $published;
        $post->save();
    }
}
