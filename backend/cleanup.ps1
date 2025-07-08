# Cleanup script for Surplus2Serve backend
# Removes unnecessary files and keeps only the essential ones

Write-Host "Cleaning up Surplus2Serve backend directory..." -ForegroundColor Yellow

# Files to remove (no longer needed)
$filesToRemove = @(
    "main_basic.py",           # Duplicate of main.py
    "quick_start.py",          # Replaced by install_packages.py and start_server.py
    "test_api.py",             # Replaced by test_mongodb_integration.py
    "setup.py",                # Replaced by setup_mongodb.py
    "setup.ps1",               # Replaced by setup_mongodb_integration.ps1
    "requirements-minimal.txt", # Using requirements.txt and requirements-mongodb.txt
    "SpoilagePredictor.jsx",   # Misplaced React component
    "retraining_log.txt"       # Old log file
)

# Directories to remove
$dirsToRemove = @(
    "__pycache__",
    "venv"
)

$removedFiles = 0
$removedDirs = 0

# Remove files
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "✓ Removed $file" -ForegroundColor Green
            $removedFiles++
        }
        catch {
            Write-Host "✗ Failed to remove $file" -ForegroundColor Red
        }
    }
}

# Remove directories
foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        try {
            Remove-Item $dir -Recurse -Force
            Write-Host "✓ Removed directory $dir" -ForegroundColor Green
            $removedDirs++
        }
        catch {
            Write-Host "✗ Failed to remove directory $dir" -ForegroundColor Red
        }
    }
}

Write-Host "`nCleanup Summary:" -ForegroundColor Cyan
Write-Host "- Removed $removedFiles files" -ForegroundColor White
Write-Host "- Removed $removedDirs directories" -ForegroundColor White

Write-Host "`nRemaining essential files:" -ForegroundColor Cyan
Get-ChildItem -File | Where-Object { $_.Name -notlike "*.pyc" } | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}

Write-Host "`n✅ Backend directory cleanup complete!" -ForegroundColor Green
