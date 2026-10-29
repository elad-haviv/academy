export function Progress({ percent, completed, total }: { percent: number; completed: number; total: number }) {
  return (
    <div className="progress" aria-label={`הושלמו ${completed} מתוך ${total} שיעורים`}>
      <span className="track">
        <span className="fill" style={{ width: `${percent}%` }} />
      </span>
      <span>
        {completed}/{total}
      </span>
    </div>
  );
}
