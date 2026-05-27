Push helpers for this repo

Use these scripts to push to the `old` remote only (will not touch `origin`).

Shell (Linux/macOS, Windows with Git Bash):

```sh
./scripts/push-old.sh "My commit message"
```

PowerShell (Windows):

```powershell
.\scripts\push-old.ps1 -Message "My commit message"
```

Notes:

- The scripts add all changes, commit only if there are staged or unstaged changes, fetch/rebase from `old` and push to `old` explicitly.
- They will not change `origin`.
