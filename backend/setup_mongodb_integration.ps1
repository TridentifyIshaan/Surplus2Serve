# Surplus2Serve MongoDB Integration Setup Script
# PowerShell script to set up MongoDB integration

param(
    [switch]$SkipMongoDB,
    [switch]$TestOnly,
    [string]$MongoURL = "mongodb://localhost:27017",
    [string]$DatabaseName = "surplus2serve"
)

Write-Host "=== Surplus2Serve MongoDB Integration Setup ===" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to install Python packages
function Install-PythonPackages {
    Write-Host "Installing Python packages..." -ForegroundColor Yellow
    
    try {
        pip install -r requirements-mongodb.txt
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Python packages installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Failed to install Python packages" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "✗ Error installing packages: $_" -ForegroundColor Red
        return $false
    }
}

# Function to create environment file
function Create-EnvironmentFile {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    if (Test-Path ".env") {
        $response = Read-Host ".env file already exists. Overwrite? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "Skipping .env file creation" -ForegroundColor Yellow
            return $true
        }
    }
    
    # Generate JWT secret
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [System.Convert]::ToBase64String($bytes)
    
    $envContent = @"
# Surplus2Serve MongoDB Configuration
MONGODB_URL=$MongoURL
DATABASE_NAME=$DatabaseName
JWT_SECRET=$jwtSecret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168

# Development settings
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","http://127.0.0.1:3000"]
LOG_LEVEL=INFO
"@
    
    try {
        Set-Content -Path ".env" -Value $envContent
        Write-Host "✓ Created .env file with MongoDB configuration" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Failed to create .env file: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    # Check prerequisites
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    if (-not (Test-Command "python")) {
        Write-Host "✗ Python is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Python found" -ForegroundColor Green
    
    if (-not (Test-Command "pip")) {
        Write-Host "✗ pip is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ pip found" -ForegroundColor Green
    
    # Check if we're in the backend directory
    if (-not (Test-Path "main.py")) {
        Write-Host "✗ main.py not found. Please run this script from the backend directory." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Backend directory confirmed" -ForegroundColor Green
    
    # Step 1: Install packages
    $packagesInstalled = Install-PythonPackages
    if (-not $packagesInstalled) {
        Write-Host "Setup failed at package installation step." -ForegroundColor Red
        exit 1
    }
    
    # Step 2: Create environment file
    $envCreated = Create-EnvironmentFile
    if (-not $envCreated) {
        Write-Host "Setup failed at environment configuration step." -ForegroundColor Red
        exit 1
    }
    
    # Success message
    Write-Host "`n=== Package Installation Complete! ===" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Run: python setup_mongodb.py" -ForegroundColor White
    Write-Host "2. Start the server: uvicorn main:app --reload" -ForegroundColor White
    Write-Host "3. Visit http://localhost:8000/docs for API documentation" -ForegroundColor White
    Write-Host "4. Run tests: python test_mongodb_integration.py" -ForegroundColor White
    Write-Host "`nMongoDB packages are ready! 🚀" -ForegroundColor Green
    
}
catch {
    Write-Host "`nSetup failed with error: $_" -ForegroundColor Red
    Write-Host "Please check the error message above and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
