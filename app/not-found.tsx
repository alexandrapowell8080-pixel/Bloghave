import Link from "next/link";
import { PublicFrame } from "@/components/PublicFrame";

export default function NotFound() {
  return (
    <PublicFrame>
      <section className="wrap" style={{ padding: "64px 0" }}>
        <p className="kicker">Missing</p>
        <h1 className="story-title">That page isn’t on this desk.</h1>
        <p className="lede">It may have been unpublished, or the address drifted.</p>
        <Link className="btn btn-primary" href="/">Back to the front</Link>
      </section>
    </PublicFrame>
  );
}
