# AGENTS

This repository uses `vem` for agent workflows.

## vem Working Rules (Enforced)

All AI agents in this repository must use `vem` and follow the working rules.

1. Start each session by reading active tasks and context through `vem` (`vem task list`, `vem context show`).
2. After code changes, persist memory updates through `vem` CLI commands (`vem context set`, `vem task ...`, `vem decision add`, or `vem finalize` for `vem_update` blocks).
3. Keep task updates atomic and mark completed work as done with evidence.
4. Record significant architectural decisions with `vem decision add`.
5. **ALWAYS run `vem finalize` immediately after producing a `vem_update` block.** Never leave a `vem_update` block unfinalized. Use:
   ```sh
   cat <<'EOF' | vem finalize --file /dev/stdin
   { ...vem_update JSON... }
   EOF
   ```
