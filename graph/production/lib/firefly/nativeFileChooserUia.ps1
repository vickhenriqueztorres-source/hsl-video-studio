param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [int]$TimeoutSeconds = 30
)

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeWindow {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}
"@

$deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
while ([DateTime]::UtcNow -lt $deadline) {
    $handle = [NativeWindow]::GetForegroundWindow()
    if ($handle -ne [IntPtr]::Zero) {
        $root = [System.Windows.Automation.AutomationElement]::FromHandle($handle)
        if ($null -ne $root -and $root.Current.Name -match '(^|\s)(Abrir|Open)(\s|$)') {
            $editCondition = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::Edit
            )
            $edits = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCondition)
            $target = $null
            foreach ($edit in $edits) {
                if ($edit.Current.AutomationId -eq '1148' -or $edit.Current.Name -match 'Nome do arquivo|File name') {
                    $target = $edit
                    break
                }
            }
            if ($null -eq $target -and $edits.Count -gt 0) { $target = $edits.Item($edits.Count - 1) }
            if ($null -eq $target) { throw 'File name edit control not found.' }

            $value = $target.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
            $value.SetValue($FilePath)

            $buttonCondition = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::Button
            )
            $buttons = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)
            $openButton = $null
            foreach ($button in $buttons) {
                if ($button.Current.Name -match '^(Abrir|Open)$') { $openButton = $button; break }
            }
            if ($null -eq $openButton) { throw 'Open button not found.' }
            $invoke = $openButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
            $invoke.Invoke()
            Write-Output "Selected file through UI Automation: $FilePath"
            exit 0
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Error 'Native file chooser was not found.'
exit 2
