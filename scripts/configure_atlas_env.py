import os
from pathlib import Path

history_path = Path(os.environ.get('APPDATA', '')) / 'Microsoft' / 'Windows' / 'PowerShell' / 'PSReadLine' / 'ConsoleHost_history.txt'
atlas_uri = None
if history_path.exists():
    with open(history_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if 'migrate_to_atlas.py --uri' in line and 'mongodb+srv' in line:
                idx = line.find('--uri')
                if idx != -1:
                    raw = line[idx+5:].strip().strip('"\'')
                    if raw.startswith('mongodb+srv'):
                        atlas_uri = raw

assert atlas_uri, 'Atlas URI not found in history!'

# Ensure database name is in the URI path
if '?' in atlas_uri:
    base_part, query_part = atlas_uri.split('?', 1)
    if not base_part.rstrip('/').endswith('coalintel'):
        base_part = base_part.rstrip('/') + '/coalintel'
    configured_uri = base_part + '?' + query_part
else:
    configured_uri = atlas_uri.rstrip('/') + '/coalintel'

# Read current .env
lines = []
with open('.env', 'r', encoding='utf-8') as f:
    for l in f:
        l_str = l.strip()
        if l_str.startswith('MONGODB_URI=') or l_str.startswith('MONGO_URI=') or l_str.startswith('DATABASE_MODE='):
            continue
        lines.append(l)

# Append atlas uri
lines.append(f'MONGODB_URI={configured_uri}\n')
lines.append(f'MONGO_URI={configured_uri}\n')
lines.append('DATABASE_MODE=atlas\n')

with open('.env', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Successfully configured .env with MongoDB Atlas URI and DATABASE_MODE=atlas')
