@echo off
setlocal
cd /d "%~dp0\.."

if not exist "web\wasm" mkdir "web\wasm"

call "%USERPROFILE%\emsdk\emsdk_env.bat"
if errorlevel 1 (
  echo Could not load emsdk from %USERPROFILE%\emsdk
  exit /b 1
)

em++ cpp\MyString.cpp cpp\bindings.cpp -o web\wasm\mystring.js ^
  -O2 ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_NAME=createMyStringModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString'] ^
  -s EXPORTED_FUNCTIONS=['_ms_create','_ms_create_empty','_ms_copy','_ms_destroy','_ms_exists','_ms_length','_ms_value','_ms_free','_ms_concat','_ms_equals','_ms_get_char','_ms_set_char','_ms_assign','_ms_stream_in']

if errorlevel 1 (
  echo WASM build failed.
  exit /b 1
)

echo WASM build succeeded: web\wasm\mystring.js and web\wasm\mystring.wasm
