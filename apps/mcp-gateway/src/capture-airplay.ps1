$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class AirPlayWindowNative {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@
[void][AirPlayWindowNative]::SetProcessDPIAware()
$window = Get-Process | Where-Object {
  $_.MainWindowHandle -ne [IntPtr]::Zero -and
  $_.MainWindowTitle -like '*AirPlay Video Stream*' -and
  [AirPlayWindowNative]::IsWindowVisible($_.MainWindowHandle)
} | Select-Object -First 1
if (-not $window) { throw 'AirPlay Video Stream window not found. Keep AirPlay mirroring visible on the PC.' }
$rect = New-Object AirPlayWindowNative+RECT
if (-not [AirPlayWindowNative]::GetWindowRect($window.MainWindowHandle, [ref]$rect)) { throw 'Could not read AirPlay window bounds.' }
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
if ($width -lt 10 -or $height -lt 10 -or $width -gt 4096 -or $height -gt 4096) { throw 'AirPlay window size is invalid or too large.' }
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$stream = New-Object System.IO.MemoryStream
try {
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($width, $height)))
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  [Console]::Out.Write([Convert]::ToBase64String($stream.ToArray()))
} finally {
  $stream.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
