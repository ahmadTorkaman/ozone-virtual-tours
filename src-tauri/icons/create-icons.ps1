Add-Type -AssemblyName System.Drawing

function Create-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(64, 156, 255))
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $fontSize = [Math]::Max(8, $size/3)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('O', $font, $brush, $rect, $sf)
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $path"
}

Create-Icon 32 '32x32.png'
Create-Icon 128 '128x128.png'
Create-Icon 256 '128x128@2x.png'

# Create ICO file (use 256x256 png as base)
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(64, 156, 255))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Arial', 80, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, 256, 256)
$g.DrawString('O', $font, $brush, $rect, $sf)
$g.Dispose()
$bmp.Save('icon.ico', [System.Drawing.Imaging.ImageFormat]::Icon)
$bmp.Dispose()
Write-Host "Created icon.ico"

# Create ICNS placeholder (just copy the 256 png, macOS build will handle it)
Copy-Item '128x128@2x.png' 'icon.icns'
Write-Host "Created icon.icns (placeholder)"

Write-Host "All icons created successfully!"
