#!/bin/sh
# start X virtual framebuffer on :99
Xvfb :99 -screen 0 1280x720x24 &

# export display so Chrome can use it
export DISPLAY=:99

# optional: small delay to ensure Xvfb started
sleep 0.5

# start your node app (or next standalone server)
exec node server.js
