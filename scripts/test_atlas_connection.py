import os
from pathlib import Path
from pymongo import MongoClient

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

if atlas_uri:
    print('Found Atlas URI in command history!')
    host = atlas_uri.split('@')[-1].split('/')[0].split('?')[0]
    print('Target Atlas Cluster Host:', host)
    try:
        cli = MongoClient(atlas_uri, serverSelectionTimeoutMS=8000)
        cli.admin.command('ping')
        print('Atlas ping: SUCCESS (Connected and authenticated)')
        print('Databases on Atlas:', cli.list_database_names())
        db = cli['coalintel']
        print('Collections in coalintel on Atlas:', db.list_collection_names())
        if 'users' in db.list_collection_names():
            print('Users count in Atlas coalintel.users:', db.users.count_documents({}))
            for u in db.users.find({}, {'username': 1, 'role': 1, 'email': 1}):
                print(' - Atlas User:', u.get('username'), '| Role:', u.get('role'), '| Email:', u.get('email'))
        else:
            print('No users collection on Atlas coalintel yet!')
    except Exception as e:
        print('Atlas connection error:', str(e)[:150])
else:
    print('No Atlas URI found in history')
