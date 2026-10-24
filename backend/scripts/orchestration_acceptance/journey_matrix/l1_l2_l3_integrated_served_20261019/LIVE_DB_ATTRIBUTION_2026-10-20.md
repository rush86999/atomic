# Live-DB attribution for attempt 2 (checked 2026-10-20)

The attempt-2 live-DB guard compared only the live file mtime and flagged
`live_db_unchanged=false`. A timestamp cannot identify a writer, so this
check records actual store access instead.

## Store access evidence

1. **The live file is held open by the pilot, not the scratch server.**

   `lsof -p 81067` (pilot, commit `8c593e57031e`) shows multiple
   read/write descriptors for:

   ```
   /Users/rushiparikh/projects/atom/backend/data/atom.db
   /Users/rushiparikh/projects/atom/backend/data/atom.db-wal
   ```

   `lsof` on the live DB/WAL names only PID 81067.

2. **The attempt-2 server declared a scratch database.**

   Config resolves `DATABASE_URL`/`ATOM_DATA_DIR` under
   `.../l2-fix/scratch/l1-l2-l3-composed-attempt2/`; the scratch SQLite
   file is `.../l1-l2-l3-composed-attempt2/atom.db` (mtime
   `2026-10-19 21:37:32`, size 8,835,072 bytes).

3. **The attempt-2 server's LanceDB root is also the scratch root.**

   `attempt2_server_pre.log` lines 455–493:

   ```
   Connecting to LanceDB at .../l1-l2-l3-composed-attempt2/atom_memory/...
   ```

   The scratch server logs contain no live `backend/data/atom.db` path.

4. **A read-only copy of the live DB + WAL has no application rows in
   the 21:50–21:59 window.**

   The copy was opened with `sqlite3` (`PRAGMA quick_check` → `ok`).
   Targeted tables (`agent_executions`, `chat_sessions`, `chat_messages`,
   `tool_mutations`, `task_operation_records`, `canvas_audit`,
   `runtime_settings`, and related audit/execution tables) contain no
   rows with a 2026-10-19 21:5x timestamp; the latest application rows
   are from 2026-10-18.

## Conclusion and remaining limit

The live `atom.db` file mtime (2026-10-19 21:53:48 EDT) is **not
evidence of an attempt-2 row write**. It is consistent with the pilot's
own SQLite checkpoint/maintenance on its open connection. The scratch
server did not write the live store.

Row-level attribution of the mtime change is still incomplete, so
live-data deployment remains held. The guard should use path identity /
open-handle inspection plus a content fingerprint, not mtime alone.
