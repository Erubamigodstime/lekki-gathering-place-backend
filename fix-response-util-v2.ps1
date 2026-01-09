# Fix all ResponseUtil.success calls to have proper message parameter
# Signature: success(res: Response, message: string, data?: T, statusCode?)

$controllerFiles = Get-ChildItem -Path "src/controllers" -Filter "*.controller.ts"

foreach ($file in $controllerFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix cases like: ResponseUtil.success(res, variableName) -> ResponseUtil.success(res, 'Success', variableName)
    # Match: ResponseUtil.success(res, word) where word is not a quoted string
    $content = $content -replace "ResponseUtil\.success\(res, (\w+)\);", "ResponseUtil.success(res, 'Success', `$1);"
    
    # Fix cases like: ResponseUtil.success(res, { key: value }) -> ResponseUtil.success(res, 'Success', { key: value })
    $lines = $content -split "`n"
    $newLines = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Match lines with ResponseUtil.success(res, { without a string before {
        if ($line -match "ResponseUtil\.success\(res, \{" -and $line -notmatch "ResponseUtil\.success\(res, ['""]") {
            $line = $line -replace "ResponseUtil\.success\(res, \{", "ResponseUtil.success(res, 'Success', {"
        }
        
        $newLines += $line
    }
    
    Set-Content $file.FullName -Value ($newLines -join "`n") -NoNewline
    Write-Host "Fixed $($file.Name)"
}

Write-Host "`nAll controller files have been fixed!"
