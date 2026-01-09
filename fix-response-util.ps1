# Script to fix ResponseUtil.success parameter order
# Correct signature: success(res, message, data?, statusCode?)
# Need to fix: success(res, data, message) -> success(res, message, data)

$controllerFiles = Get-ChildItem -Path "src/controllers" -Filter "*.controller.ts"

foreach ($file in $controllerFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Pattern 1: ResponseUtil.success(res, variable, 'string', number)
    # Change to: ResponseUtil.success(res, 'string', variable, number)
    $content = $content -replace "ResponseUtil\.success\(res, (\w+), ('.*?'), (\d+)\)", "ResponseUtil.success(res, `$2, `$1, `$3)"
    
    # Pattern 2: ResponseUtil.success(res, variable, 'string')
    # Change to: ResponseUtil.success(res, 'string', variable)
    $content = $content -replace "ResponseUtil\.success\(res, (\w+), ('.*?')\)", "ResponseUtil.success(res, `$2, `$1)"
    
    # Pattern 3: ResponseUtil.success(res, {object}, 'string')
    $content = $content -replace "ResponseUtil\.success\(res, \{ ([^\}]+) \}, ('.*?')\)", "ResponseUtil.success(res, `$2, { `$1 })"
    
    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Fixed $($file.Name)"
}

Write-Host "`nAll controller files have been fixed!"
