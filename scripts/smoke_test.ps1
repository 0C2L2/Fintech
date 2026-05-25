$body = @{ full_name='Smoke Test'; email='smoke_test_1@local.com'; password='password123' }
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/register' -Method Post -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json' -ErrorAction Stop
  Write-Output 'REGISTER:'
  $r | ConvertTo-Json -Depth 10 | Write-Output
} catch {
  Write-Output 'REGISTER ERROR:'
  Write-Output $_.Exception.Message
}

try {
  $loginBody = @{ email='smoke_test_1@local.com'; password='password123' }
  $login = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/login' -Method Post -Body ($loginBody | ConvertTo-Json -Depth 10) -ContentType 'application/json' -ErrorAction Stop
  Write-Output 'LOGIN:'
  $login | ConvertTo-Json -Depth 10 | Write-Output
} catch {
  Write-Output 'LOGIN ERROR:'
  Write-Output $_.Exception.Message
}
