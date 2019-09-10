# Adapted from https://github.com/octan3/img-clipboard-dump/blob/master/dump-clipboard-png.ps1
param($imagePath)

# https://github.com/PowerShell/PowerShell/issues/7233
# fix the output encoding bug
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

Add-Type -Assembly PresentationCore
function main {
    $img = [Windows.Clipboard]::GetImage()

    if ($img -eq $null) {
        "no image"
        Exit 1
    }

    if (-not $imagePath) {
        "no image"
        Exit 1
    }

    $fcb = new-object Windows.Media.Imaging.FormatConvertedBitmap($img, [Windows.Media.PixelFormats]::Rgb24, $null, 0)
    $stream = [IO.File]::Open($imagePath, "OpenOrCreate")
    $encoder = New-Object Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($fcb)) | out-null
    $encoder.Save($stream) | out-null
    $stream.Dispose() | out-null

    $imagePath
}

try {
    # For WIN10
    $file = Get-Clipboard -Format FileDropList
    if ($file -ne $null) {
        Convert-Path $file
        Exit 1
    }
} catch {
    # For WIN7 WIN8 WIN10
    main
}

main