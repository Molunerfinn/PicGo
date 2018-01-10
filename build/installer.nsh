 !macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\PicGo"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\PicGo"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\PicGo"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\PicGo"
 !macroend