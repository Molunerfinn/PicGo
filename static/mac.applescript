-- From https://github.com/mushanshitiancai/vscode-paste-image
property fileTypes : {{«class PNGf», ".png"}}

on run argv
  if argv is {} then
    return ""
  end if
  
  set imagePath to (item 1 of argv)
  set theType to getType()
  
  if theType is not missing value then
    try
      set myFile to (open for access imagePath with write permission)
      set eof myFile to 0
      write (the clipboard as (first item of theType)) to myFile
      close access myFile
      return (POSIX path of imagePath)
    on error
      try
        close access myFile
      end try
      return ""
    end try
  else
    return "no image"
  end if
end run

on getType()
  repeat with aType in fileTypes
    repeat with theInfo in (clipboard info)
      if (first item of theInfo) is equal to (first item of aType) then return aType
    end repeat
  end repeat
  return missing value
end getType

