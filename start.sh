#!/bin/sh
set -e

# start X virtual framebuffer on :99
Xvfb :99 -screen 0 1280x1400x24 &

# export display for Chrome
export DISPLAY=:99

# short wait to ensure Xvfb is ready
sleep 1

# debug info
echo "Start script: DISPLAY=$DISPLAY, PUPPETEER_EXECUTABLE_PATH=${PUPPETEER_EXECUTABLE_PATH:-/usr/bin/google-chrome-stable}"
echo "PORT=${PORT:-(not set)}"

# start the Next standalone server (adjust path if server.js located elsewhere)
exec node server.js
