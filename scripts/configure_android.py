from pathlib import Path
import re
p=Path('android/app/build.gradle')
s=p.read_text()
if 'versionCode 1' not in s: s=re.sub(r'versionCode\s+\d+', 'versionCode 1', s)
if 'versionName "1.0"' not in s: s=re.sub(r'versionName\s+["\'][^"\']+["\']', 'versionName "1.0"', s)
if 'CM_KEYSTORE_PATH' not in s:
    signing='    signingConfigs {\n        release {\n            storeFile file(System.getenv("CM_KEYSTORE_PATH"))\n            storePassword System.getenv("CM_KEYSTORE_PASSWORD")\n            keyAlias System.getenv("CM_KEY_ALIAS")\n            keyPassword System.getenv("CM_KEY_PASSWORD")\n        }\n    }\n'
    s=s.replace('    buildTypes {',signing+'    buildTypes {',1)
    s=s.replace('        release {\n','        release {\n            signingConfig signingConfigs.release\n',1) if False else s
    start=s.index('    buildTypes {')
    s=s[:start]+s[start:].replace('        release {','        release {\n            signingConfig signingConfigs.release',1)
p.write_text(s)
