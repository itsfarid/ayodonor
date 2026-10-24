import { MYTHS } from "../data/myths";

/** Each belief with what the sources support, as a term/definition list. */
export default function MythList() {
  return (
    <dl className="defs">
      {MYTHS.map((m) => (
        <div key={m.id}>
          <dt>{m.myth}</dt>
          <dd>
            <strong>Faktanya:</strong> {m.fact}
          </dd>
        </div>
      ))}
    </dl>
  );
}
