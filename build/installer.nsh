!macro customInstall
   SetRegView 64
   WriteRegStr HKCR "*\shell\PicGo" "" "Upload pictures w&ith PicGo"
   WriteRegStr HKCR "*\shell\PicGo" "Icon" "$INSTDIR\PicGo.exe"
   WriteRegStr HKCR "*\shell\PicGo\command" "" '"$INSTDIR\PicGo.exe" "upload" "%1"'
   SetRegView 32
   WriteRegStr HKCR "*\shell\PicGo" "" "Upload pictures w&ith PicGo"
   WriteRegStr HKCR "*\shell\PicGo" "Icon" "$INSTDIR\PicGo.exe"
   WriteRegStr HKCR "*\shell\PicGo\command" "" '"$INSTDIR\PicGo.exe" "upload" "%1"'
!macroend
!macro customUninstall
   DeleteRegKey HKCR "*\shell\PicGo"
!macroend
