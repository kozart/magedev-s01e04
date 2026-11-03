import type { Digest } from '../digest/types.js';

// Rows arrive sorted by job from readNight. Missing data is `—`, never an empty cell.
// Flags are text as well as colour, so they read without the warn class.
export function DigestPage({ night, digest }: { night: string; digest: Digest | null }) {
  if (digest === null) {
    return (
      <>
        <h1>digest · {night}</h1>
        <p class="warn">no run log for this night</p>
      </>
    );
  }

  return (
    <>
      <h1>digest · {night}</h1>
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => {
              const retriesFlag = row.retries >= 3;
              const failed = row.lastStatus === 'fail';
              return (
                <tr>
                  <td>{row.job}</td>
                  <td>{row.owner ?? '—'}</td>
                  <td>{row.runs}</td>
                  <td>
                    {retriesFlag ? (
                      <span class="warn">
                        {row.retries} ⚠ retries
                      </span>
                    ) : (
                      row.retries
                    )}
                  </td>
                  <td>{failed ? <span class="warn">fail</span> : row.lastStatus}</td>
                  <td>{row.lastError ?? '—'}</td>
                  <td>{row.first}</td>
                  <td>{row.last}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} lines could not be read</p> : null}
    </>
  );
}
