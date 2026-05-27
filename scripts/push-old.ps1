Param([string]$Message = "Update from local")
# PowerShell helper: commit if needed, rebase from 'old', then push to 'old'
# Usage: .\scripts\push-old.ps1 -Message "My commit message"

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Branch: $branch"

git add -A
try {
    git commit -m $Message | Out-Null
    Write-Host "Committed changes"
} catch {
    Write-Host "No changes to commit"
}

# Fetch and rebase
git fetch old
try {
    git pull --rebase old $branch
} catch {
    Write-Host "rebase failed or nothing to rebase"
}

# Push to 'old'
git push old $branch
