export function AdUnit({ placement }: { placement: "home" | "workspace" }) {
  return (
    <aside className={`ad-wrap ad-wrap-${placement}`} aria-label="Advertisement">
      <div className="ad-unit">
        <span>ADVERTISEMENT</span>
        <p>Reserved for one quiet sponsor message.</p>
      </div>
    </aside>
  );
}
