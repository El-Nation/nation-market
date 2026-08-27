$files = Get-ChildItem -Path . -Recurse -Include *.tsx, *.ts, *.js | Where-Object { $_.FullName -notmatch 'node_modules|\.next|dist|\.expo' }
foreach ($f in $files) {
    $text = Get-Content -Path $f.FullName -Raw
    $modified = $false

    if ($text -match 'http://localhost:\d+') {
        Write-Host "Found localhost in $($f.FullName)"
    }
}
