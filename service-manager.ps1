# Coffee Machine Service Manager GUI
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "☕ K2 Coffee Machine Service Manager"
$form.Size = New-Object System.Drawing.Size(500, 400)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

# Service names
$tunnelService = "CoffeeTunnel"
$backendService = "CoffeeBackend"

# Create status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 20)
$statusLabel.Size = New-Object System.Drawing.Size(450, 100)
$statusLabel.Text = "Loading service status..."
$statusLabel.Font = New-Object System.Drawing.Font("Consolas", 10)
$form.Controls.Add($statusLabel)

# Function to update status
function Update-Status {
    try {
        $tunnelStatus = (Get-Service -Name $tunnelService -ErrorAction SilentlyContinue).Status
        $backendStatus = (Get-Service -Name $backendService -ErrorAction SilentlyContinue).Status
        
        $statusText = @"
🌐 Cloudflare Tunnel: $($tunnelStatus ?? 'Not Installed')
☕ Coffee Backend:    $($backendStatus ?? 'Not Installed')

Last Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
        
        $statusLabel.Text = $statusText
        
        # Update button states
        $startBtn.Enabled = ($tunnelStatus -ne "Running" -or $backendStatus -ne "Running")
        $stopBtn.Enabled = ($tunnelStatus -eq "Running" -or $backendStatus -eq "Running")
        
    } catch {
        $statusLabel.Text = "Error getting service status: $($_.Exception.Message)"
    }
}

# Create buttons
$buttonY = 140
$buttonWidth = 100
$buttonHeight = 30
$buttonSpacing = 110

# Start button
$startBtn = New-Object System.Windows.Forms.Button
$startBtn.Location = New-Object System.Drawing.Point(20, $buttonY)
$startBtn.Size = New-Object System.Drawing.Size($buttonWidth, $buttonHeight)
$startBtn.Text = "▶ Start"
$startBtn.BackColor = [System.Drawing.Color]::LightGreen
$startBtn.Add_Click({
    try {
        $statusLabel.Text = "🚀 Starting services..."
        $form.Refresh()
        
        Start-Service $tunnelService -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-Service $backendService -ErrorAction SilentlyContinue
        
        Start-Sleep -Seconds 1
        Update-Status
        [System.Windows.Forms.MessageBox]::Show("Services started successfully!", "Success", "OK", "Information")
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Error starting services: $($_.Exception.Message)", "Error", "OK", "Error")
        Update-Status
    }
})
$form.Controls.Add($startBtn)

# Stop button
$stopBtn = New-Object System.Windows.Forms.Button
$stopBtn.Location = New-Object System.Drawing.Point((20 + $buttonSpacing), $buttonY)
$stopBtn.Size = New-Object System.Drawing.Size($buttonWidth, $buttonHeight)
$stopBtn.Text = "⏹ Stop"
$stopBtn.BackColor = [System.Drawing.Color]::LightCoral
$stopBtn.Add_Click({
    try {
        $statusLabel.Text = "🛑 Stopping services..."
        $form.Refresh()
        
        Stop-Service $backendService -ErrorAction SilentlyContinue
        Stop-Service $tunnelService -ErrorAction SilentlyContinue
        
        Start-Sleep -Seconds 1
        Update-Status
        [System.Windows.Forms.MessageBox]::Show("Services stopped successfully!", "Success", "OK", "Information")
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Error stopping services: $($_.Exception.Message)", "Error", "OK", "Error")
        Update-Status
    }
})
$form.Controls.Add($stopBtn)

# Restart button
$restartBtn = New-Object System.Windows.Forms.Button
$restartBtn.Location = New-Object System.Drawing.Point((20 + $buttonSpacing * 2), $buttonY)
$restartBtn.Size = New-Object System.Drawing.Size($buttonWidth, $buttonHeight)
$restartBtn.Text = "🔄 Restart"
$restartBtn.BackColor = [System.Drawing.Color]::LightBlue
$restartBtn.Add_Click({
    try {
        $statusLabel.Text = "🔄 Restarting services..."
        $form.Refresh()
        
        Stop-Service $backendService -ErrorAction SilentlyContinue
        Stop-Service $tunnelService -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-Service $tunnelService -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-Service $backendService -ErrorAction SilentlyContinue
        
        Start-Sleep -Seconds 1
        Update-Status
        [System.Windows.Forms.MessageBox]::Show("Services restarted successfully!", "Success", "OK", "Information")
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Error restarting services: $($_.Exception.Message)", "Error", "OK", "Error")
        Update-Status
    }
})
$form.Controls.Add($restartBtn)

# Refresh button
$refreshBtn = New-Object System.Windows.Forms.Button
$refreshBtn.Location = New-Object System.Drawing.Point((20 + $buttonSpacing * 3), $buttonY)
$refreshBtn.Size = New-Object System.Drawing.Size($buttonWidth, $buttonHeight)
$refreshBtn.Text = "🔍 Refresh"
$refreshBtn.BackColor = [System.Drawing.Color]::LightYellow
$refreshBtn.Add_Click({
    Update-Status
})
$form.Controls.Add($refreshBtn)

# Create logs text box
$logsLabel = New-Object System.Windows.Forms.Label
$logsLabel.Location = New-Object System.Drawing.Point(20, 190)
$logsLabel.Size = New-Object System.Drawing.Size(200, 20)
$logsLabel.Text = "Recent Logs:"
$logsLabel.Font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($logsLabel)

$logsTextBox = New-Object System.Windows.Forms.TextBox
$logsTextBox.Location = New-Object System.Drawing.Point(20, 210)
$logsTextBox.Size = New-Object System.Drawing.Size(450, 100)
$logsTextBox.Multiline = $true
$logsTextBox.ScrollBars = "Vertical"
$logsTextBox.ReadOnly = $true
$logsTextBox.Font = New-Object System.Drawing.Font("Consolas", 8)
$form.Controls.Add($logsTextBox)

# View logs button
$viewLogsBtn = New-Object System.Windows.Forms.Button
$viewLogsBtn.Location = New-Object System.Drawing.Point(20, 320)
$viewLogsBtn.Size = New-Object System.Drawing.Size(100, 30)
$viewLogsBtn.Text = "📋 View Logs"
$viewLogsBtn.Add_Click({
    try {
        $projectRoot = $PSScriptRoot
        $tunnelLog = "$projectRoot\logs\tunnel.log"
        $backendLog = "$projectRoot\logs\backend.log"
        
        $logContent = ""
        
        if (Test-Path $tunnelLog) {
            $logContent += "=== Tunnel Logs ===`r`n"
            $logContent += (Get-Content $tunnelLog -Tail 5 -ErrorAction SilentlyContinue) -join "`r`n"
            $logContent += "`r`n`r`n"
        }
        
        if (Test-Path $backendLog) {
            $logContent += "=== Backend Logs ===`r`n"
            $logContent += (Get-Content $backendLog -Tail 5 -ErrorAction SilentlyContinue) -join "`r`n"
        }
        
        if ($logContent -eq "") {
            $logContent = "No log files found."
        }
        
        $logsTextBox.Text = $logContent
    } catch {
        $logsTextBox.Text = "Error reading logs: $($_.Exception.Message)"
    }
})
$form.Controls.Add($viewLogsBtn)

# Open URLs button
$openUrlsBtn = New-Object System.Windows.Forms.Button
$openUrlsBtn.Location = New-Object System.Drawing.Point(140, 320)
$openUrlsBtn.Size = New-Object System.Drawing.Size(100, 30)
$openUrlsBtn.Text = "🌐 Open URLs"
$openUrlsBtn.Add_Click({
    try {
        Start-Process "https://k2.hydromods.org/kiosk"
        Start-Process "https://k2.hydromods.org/items"
        [System.Windows.Forms.MessageBox]::Show("Opened Coffee Machine URLs in browser!", "Success", "OK", "Information")
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Error opening URLs: $($_.Exception.Message)", "Error", "OK", "Error")
    }
})
$form.Controls.Add($openUrlsBtn)

# Auto-refresh timer
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000  # 5 seconds
$timer.Add_Tick({
    Update-Status
})
$timer.Start()

# Initial status update
Update-Status

# Show the form
$form.ShowDialog()
