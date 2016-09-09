#Dotfiles
Feel free to use them if you want

#Files
1. transfer-sleep-lock-i3lock.sh - for xss-lock -l option (Locks computer before suspending/hibernating)
2. i3lock-custom - color scheme for i3lock with wallpaper needs i3lock-color from AUR
3. hotplug-monitor.sh - Called by udev when a monitor is plugged in, extends the screen by adding the monitor to the left
4. compton.conf - Compton config better than xcompmgr (no more tearing!)
5. *.desktop files 
  -guake.desktop - Startup guake (A drop down terminal)
  -xss-lock - runs xss-lock (A way of hooking into the suspend/hibernate so you can lock the screen)
  -udiskie - runs udiskie (Automounting of USB/Harddrives)
  -compton - runs compton the fork of xcompmgr

#Commands
1. feh --bg-scale ~/wallpaper.png - set wallpaper, must be png otherwise memory issues
2. xss-lock -l /usr/bin/i3lock-files/transfer-sleep-lock-i3lock.sh & - setup automatic locking
3. compton --config ~/.config/compton.conf -b - Fading and transparency, daemon mode
4. /usr/bin/i3-nagbar -m 'Low Battery!' & - Run i3-nagbar, red bar at the top of the screen, to remind me to plug in, before it hibernates
5. systemctl hibernate - Hibernate the system (xss-lock doesn't lock the screen on hibernate when battery is low, 
   Issue: systemctl is running from system not user, but when running from user, systemctl requires interactive authencation :/ )
6. xrandr --output VGA1 --left-of LVDS1 --preferred --primary --output LVDS1 --preferred
   Connects VGA1, extending the display to the left
