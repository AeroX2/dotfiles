#! /usr/bin/bash
# Sets right perspective when monitor is plugged in
# Needed by udev rule /etc/udev/rules.d/95-hotplug-monitor
export DISPLAY=:0
export XAUTHORITY=~/.Xauthority

function connect(){
    xrandr --output VGA1 --left-of LVDS1 --preferred --primary --output LVDS1 --preferred
}

function disconnect(){
      xrandr --output VGA1 --off
}

xrandr | grep "VGA1 connected" &> /dev/null && connect || disconnect
