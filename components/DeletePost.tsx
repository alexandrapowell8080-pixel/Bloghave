"use client";

export function DeletePost({ id }: { id: string }) {
  return (
    <button
      className="btn btn-ghost btn-tiny"
      type="button"
      onClick={async () => {
        if (!confirm("Remove this piece from the desk?")) return;
        const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
        if (response.ok) location.reload();
      }}
    >
      Remove
    </button>
  );
}
