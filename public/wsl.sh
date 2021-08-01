#!/bin/sh
# grab the paths
scriptPath=$(echo $0 | awk '{ print substr( $0, 1, length($0)-6 ) }')"windows10.ps1"
imagePath=$(echo $1 | awk '{ print substr( $0, 1, length($0)-18 ) }')
imageName=$(echo $1 | awk '{ print substr( $0, length($0)-17, length($0) ) }')

# run the powershell script
res=$(powershell.exe -noprofile -noninteractive -nologo -sta -executionpolicy unrestricted -file $(wslpath -w $scriptPath) $(wslpath -w $imagePath)"\\"$imageName)

# note that there is a return symbol in powershell result
noImage=$(echo "no image\r")

# check whether image exists
if [ "$res" = "$noImage" ] ;then
    echo "no image"
else
    echo $(wslpath -u $res)
fi
