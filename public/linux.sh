#!/bin/sh
# require xclip(see http://stackoverflow.com/questions/592620/check-if-a-program-exists-from-a-bash-script/677212#677212)
command -v xclip >/dev/null 2>&1 || { echo >&1 "no xclip"; exit 1; }

# write image in clipboard to file (see http://unix.stackexchange.com/questions/145131/copy-image-from-clipboard-to-file)
filePath=`xclip -selection clipboard -o 2>/dev/null | grep ^file:// | cut -c8-`
if [ ! -n "$filePath" ] ;then
  if
      xclip -selection clipboard -target image/png -o >/dev/null 2>&1
  then
      xclip -selection clipboard -target image/png -o >$1 2>/dev/null
      echo $1
  else
      echo "no image"
  fi
else
  echo $filePath
fi
