@echo off
cd /d "%~dp0"
title HSL Matrix Console
npm.cmd run hsl:matrix
if errorlevel 1 pause
