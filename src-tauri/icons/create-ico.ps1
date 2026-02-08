Add-Type -AssemblyName System.Drawing

# Create bitmaps at different sizes for ICO
$sizes = @(16, 32, 48, 256)
$images = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(64, 156, 255))

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $fontSize = [Math]::Max(8, $size * 0.6)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('O', $font, $brush, $rect, $sf)
    $g.Dispose()

    $images += $bmp
}

# Create ICO file manually (proper format)
$icoPath = "icon.ico"
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICO Header
$bw.Write([Int16]0)      # Reserved
$bw.Write([Int16]1)      # Type: 1 = ICO
$bw.Write([Int16]$images.Count)  # Number of images

# Calculate offsets
$headerSize = 6
$dirEntrySize = 16
$offset = $headerSize + ($dirEntrySize * $images.Count)
$imageData = @()

# Write directory entries and collect image data
for ($i = 0; $i -lt $images.Count; $i++) {
    $bmp = $images[$i]
    $size = $bmp.Width

    # Convert bitmap to PNG bytes
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Dispose()

    # Directory entry
    $bw.Write([byte]$(if ($size -ge 256) { 0 } else { $size }))  # Width
    $bw.Write([byte]$(if ($size -ge 256) { 0 } else { $size }))  # Height
    $bw.Write([byte]0)           # Color palette
    $bw.Write([byte]0)           # Reserved
    $bw.Write([Int16]1)          # Color planes
    $bw.Write([Int16]32)         # Bits per pixel
    $bw.Write([Int32]$pngBytes.Length)  # Image size
    $bw.Write([Int32]$offset)    # Offset

    $imageData += ,($pngBytes)
    $offset += $pngBytes.Length
}

# Write image data
foreach ($data in $imageData) {
    $bw.Write($data)
}

$bw.Close()
$fs.Close()

# Cleanup
foreach ($bmp in $images) {
    $bmp.Dispose()
}

Write-Host "Created proper icon.ico with $($images.Count) sizes"
