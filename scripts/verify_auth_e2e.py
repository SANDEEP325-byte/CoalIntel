import requests

base = 'http://127.0.0.1:8000'

print('=== 1. VERIFY HEALTH & BACKEND ===')
h = requests.get(base + '/health')
assert h.status_code == 200, f'Health failed: {h.status_code}'
print('Backend online: 200 OK')

print('\n=== 2. PUBLIC SIGNUP (NO ORG, NO ROLE SELECTION) ===')
reg_payload = {
    'full_name': 'Rajesh Sharma',
    'email': 'rajesh.viewer2@coalintel.gov.in',
    'username': 'rajesh_viewer2',
    'password': 'ViewerPassword123!'
}
r_reg = requests.post(base + '/auth/register', json=reg_payload)
if r_reg.status_code == 400 and 'already exists' in r_reg.text:
    print('User already exists from earlier test, proceeding to login')
else:
    assert r_reg.status_code == 201, f'Register failed: {r_reg.status_code} {r_reg.text}'
    user_data = r_reg.json()['user']
    assert user_data.get('role') == 'VIEWER', f'Unexpected role: {user_data}'
    print('Registered successfully! Default role is VIEWER:', user_data)

print('\n=== 3. VIEWER SIGN IN & TOKEN RETRIEVAL ===')
r_login = requests.post(base + '/auth/login', json={'username': 'rajesh_viewer2', 'password': 'ViewerPassword123!'})
assert r_login.status_code == 200, f'Login failed: {r_login.status_code} {r_login.text}'
viewer_token = r_login.json()['access_token']
viewer_user = r_login.json()['user']
print('Viewer login successful:', viewer_user['username'], 'has role:', viewer_user['role'])

print('\n=== 4. VIEWER PERMISSION CHECKS (403 ON ADMIN ROUTES) ===')
v_headers = {'Authorization': f'Bearer {viewer_token}'}
# Permitted: documents
doc_res = requests.get(base + '/documents', headers=v_headers)
assert doc_res.status_code == 200, f'Viewer cannot read documents: {doc_res.status_code}'
print('Viewer reading documents: 200 OK (Allowed)')

# Forbidden: users list
u_res = requests.get(base + '/auth/users', headers=v_headers)
assert u_res.status_code == 403, f'Viewer accessed admin users endpoint! Status: {u_res.status_code}'
print('Viewer accessing /auth/users: 403 Forbidden (Blocked as expected)')

# Forbidden: roles list
role_res = requests.get(base + '/auth/roles', headers=v_headers)
assert role_res.status_code == 403, f'Viewer accessed admin roles endpoint! Status: {role_res.status_code}'
print('Viewer accessing /auth/roles: 403 Forbidden (Blocked as expected)')

print('\n=== 5. ADMIN LOGIN & USERS MANAGEMENT ===')
r_admin = requests.post(base + '/auth/login', json={'username': 'admin', 'password': 'Admin@CoalIntel2026'})
assert r_admin.status_code == 200
admin_token = r_admin.json()['access_token']
a_headers = {'Authorization': f'Bearer {admin_token}'}

# Admin fetches users
users_res = requests.get(base + '/auth/users', headers=a_headers)
assert users_res.status_code == 200
users_data = users_res.json()
assert 'users' in users_data and 'count' in users_data
print('Admin loaded users count:', users_data['count'])

# Find rajesh_viewer2
target_user = next((u for u in users_data['users'] if u['username'] == 'rajesh_viewer2'), None)
assert target_user is not None, 'rajesh_viewer2 not found in users list'

print('\n=== 6. ADMIN REASSIGNS ROLE: VIEWER -> ANALYST ===')
target_id = target_user['id']
patch_res = requests.patch(
    f'{base}/auth/users/{target_id}/role',
    headers=a_headers,
    json={'role': 'ANALYST'}
)
assert patch_res.status_code == 200, f'Role patch failed: {patch_res.text}'
print('Admin updated role to ANALYST:', patch_res.json()['role'])

# Verify persistence
recheck_res = requests.get(base + '/auth/users', headers=a_headers)
updated_target = next(u for u in recheck_res.json()['users'] if u['username'] == 'rajesh_viewer2')
assert updated_target['role'] == 'ANALYST', f'Role not persisted! Found: {updated_target["role"]}'
print('Role change persisted in database: ANALYST')

print('\n=== 7. SELF-DEMOTION & UNAUTHENTICATED PROTECTION ===')
# Admin self-demotion blocked
admin_self_id = r_admin.json()['user']['id']
demote_res = requests.patch(f'{base}/auth/users/{admin_self_id}/role', headers=a_headers, json={'role': 'VIEWER'})
assert demote_res.status_code == 400, f'Expected 400 on self-demotion, got {demote_res.status_code}'
print('Admin self-demotion protection: 400 Bad Request (Blocked)')

# Unauthenticated access to /auth/me returns 401
unauth_res = requests.get(base + '/auth/me')
assert unauth_res.status_code == 401, f'Expected 401, got {unauth_res.status_code}'
print('Unauthenticated protected route check: 401 Unauthorized (Blocked)')

print('\n>>> ALL 7 END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<')
