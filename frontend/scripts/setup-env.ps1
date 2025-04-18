# Get the server's IP address
$SERVER_IP = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -eq "Dhcp" }).IPAddress

# Create the environment file
@"
VITE_SERVER_HOST=$SERVER_IP
VITE_SERVER_PORT=3001
VITE_DEV_PORT=3000
"@ | Out-File -FilePath "../.env.development.local" -Encoding utf8

Write-Host "Environment file created with IP: $SERVER_IP" 