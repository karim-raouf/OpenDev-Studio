@echo off
TITLE Publishing Update to PyPI...

echo.
echo -----------------------------------------
echo STEP 1: Cleaning old build artifacts...
echo -----------------------------------------
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist *.egg-info rmdir /s /q *.egg-info

echo.
echo -----------------------------------------
echo STEP 2: Building new version...
echo -----------------------------------------
python -m build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build Failed! Exiting...
    pause
    exit /b
)

echo.
echo -----------------------------------------
echo STEP 3: Uploading to PyPI...
echo -----------------------------------------
twine upload dist/*

echo.
echo -----------------------------------------
echo ✅ SUCCESS! Update published.
echo Users can now run: pip install --upgrade opendev-studio
echo -----------------------------------------
pause