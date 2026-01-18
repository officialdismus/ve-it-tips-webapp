# Simple HTTP Server for Village Enterprise IT Tips Web App

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Village Enterprise IT Tips Server" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$port = 8000
$url = "http://localhost:$port/"

Write-Host "Server will run at: $url" -ForegroundColor Yellow
Write-Host ""

# Create a simple HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "Server started successfully!" -ForegroundColor Green
Write-Host "Open your browser to: $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/" -or $localPath -eq "") {
        $localPath = "/index.html"
    }

    $filePath = Join-Path $PSScriptRoot $localPath.TrimStart('/')

    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath)

        # Set content type
        $contentType = switch ($extension) {
            ".html" { "text/html; charset=utf-8" }
            ".css" { "text/css; charset=utf-8" }
            ".js" { "application/javascript; charset=utf-8" }
            default { "application/octet-stream" }
        }

        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.StatusCode = 200

        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
        $response.ContentLength64 = $notFound.Length
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }

    $response.Close()
}

$listener.Stop()
Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow