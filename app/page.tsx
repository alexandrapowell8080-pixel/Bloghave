import Link from "next/link";
import { PublicFrame } from "@/components/PublicFrame";
import { JsonLd } from "@/components/Seo";
import { TypeLine } from "@/components/TypeLine";
import { Cover } from "@/components/Cards";
import { itemListLd, organizationLd, pageMeta, websiteLd } from "@/lib/seo";
import { listCards } from "@/lib/store";
import { formatStamp } from "@/lib/text";

const COVER_LINES = [
  "welcome to Fellohtech.com services",
  "Write it once. It arrives intact.",
  "Stories and questions, sent intact.",
];

const HOME_DESCRIPTION = "Write an article or FAQ once on Bloghave. The edited page, the writer, and both dates arrive intact on every linked desk.";

export const dynamic = "force-dynamic";
export const metadata = pageMeta({
  title: "Bloghave · Articles and FAQs, sent intact",
  description: HOME_DESCRIPTION,
  path: "/",
  absolute: true,
  keywords: ["writing desk", "publish articles", "publish FAQs", "linked desks"],
});

export default function HomePage() {
  const stories = listCards({ kind: "article", publicOnly: true });
  const faqs = listCards({ kind: "faq", publicOnly: true });
  const featured = stories.find((story) => story.featured) || stories[0];
  const rest = stories.filter((story) => story.id !== featured?.id).slice(0, 3);
  return (
    <PublicFrame crumbs={[{ name: "Home", path: "/" }]}>
      <JsonLd data={[websiteLd(HOME_DESCRIPTION), organizationLd(HOME_DESCRIPTION), itemListLd("Stories", "/blog", stories.slice(0, 12).map((story) => ({ name: story.title, path: `/blog/${story.slug}` })))]} />
      <section className="hero wrap">
        <div>
          <p className="kicker">The writing desk</p>
          <h1 className="story-title">Write it once. It arrives intact.</h1>
          <p className="lede">Articles and questions are different shapes. Both leave with their type, their pictures, the writer’s name, and the two times the desk stamped itself.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/desk">Open the desk</Link>
            <Link className="btn btn-ghost" href="/blog">Read the stories</Link>
          </div>
        </div>
        {featured ? (
          <Link className="feature-card" href={`/blog/${featured.slug}`}>
            <div className="feature-cover">
              <Cover src={featured.coverImage} seed={featured.slug} alt="" mark={false} />
              <div className="feature-type">
                <TypeLine lines={COVER_LINES} className="cover-type" />
              </div>
            </div>
            <div className="feature-copy">
              <span className="stamp">{featured.section || "Story"}</span>
              <h2>{featured.title}</h2>
              <p className="dek" style={{ fontSize: "1.05rem" }}>{featured.excerpt}</p>
              <p className="meta">{featured.author.name} · {formatStamp(featured.publishedAt)}</p>
            </div>
          </Link>
        ) : (
          <div className="empty">The first story you publish to this desk will stand here.</div>
        )}
      </section>
      <section className="wrap">
        <div className="section-head">
          <h2>Latest stories</h2>
          <Link href="/blog">Archive</Link>
        </div>
        {rest.length ? (
          <div className="story-grid">
            {rest.map((story) => (
              <Link key={story.id} className="story-card" href={`/blog/${story.slug}`}>
                <div className="pad">
                  <span className="stamp">{story.section || "Story"}</span>
                  <h3>{story.title}</h3>
                  <p className="meta">{story.excerpt}</p>
                  <p className="meta">{story.author.name} · {formatStamp(story.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <section className="faq-band">
        <div className="wrap faq-band-grid">
          <div>
            <p className="kicker">Questions</p>
            <h2>FAQs keep their own shape.</h2>
            <p>A question is a category, a short answer, and the fuller one. It does not borrow a feature’s costume on the way out.</p>
            <Link href="/faq">All questions</Link>
          </div>
          <ol className="faq-list">
            {faqs.slice(0, 4).map((faq) => (
              <li key={faq.id}>
                <Link href={`/faq/${faq.slug}`}>
                  <span>{faq.section}</span>
                  <strong>{faq.title}</strong>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="wrap">
        <div className="section-head">
          <h2>How a desk is linked</h2>
        </div>
        <div className="steps">
          <article className="step">
            <em>01</em>
            <h3>Name the system</h3>
            <p>Register the other site with a system id, its ingest address, and the key it gave you.</p>
          </article>
          <article className="step">
            <em>02</em>
            <h3>Give it a way back</h3>
            <p>Hand over this desk’s ingest address and inbound key, or pair both Bloghave desks with a code.</p>
          </article>
          <article className="step">
            <em>03</em>
            <h3>Choose the id and send</h3>
            <p>The headline, figure, answer, byline, and both dates go to that system as you left them.</p>
          </article>
        </div>
      </section>
    </PublicFrame>
  );
}
