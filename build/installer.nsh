; Holy CLI - Custom NSIS installer script

!macro customInstall
  MessageBox MB_ICONQUESTION|MB_YESNO "Create a desktop shortcut for Holy CLI?" IDNO skip_desktop
    CreateShortCut "$DESKTOP\Holy CLI.lnk" "$INSTDIR\holycli.exe" "" "$INSTDIR\holycli.exe" 0
  skip_desktop:
!macroend
