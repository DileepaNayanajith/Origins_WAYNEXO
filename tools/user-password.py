#!/usr/bin/env python3
"""Generate a parameter-free SQL UPDATE for a reviewed existing account. No DB connection."""
import base64
import getpass
import hashlib
import os
import re
import sys
if len(sys.argv) != 2 or not re.fullmatch(r'[A-Za-z0-9_.-]{1,255}', sys.argv[1]):
    raise SystemExit('Usage: python3 tools/user-password.py USERNAME (letters, numbers, _, ., -)')
pw = getpass.getpass('New password (minimum 12 characters): ')
if len(pw) < 12 or pw != getpass.getpass('Confirm password: '):
    raise SystemExit('Password must be at least 12 characters and confirmations must match')
salt = os.urandom(16)
hashed = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt, 120000, 32)
stored = 'pbkdf2$120000$' + base64.b64encode(salt).decode() + '$' + base64.b64encode(hashed).decode()
print('START TRANSACTION;')
print("UPDATE app_users SET password_hash='" + stored + "' WHERE username='" + sys.argv[1] + "';")
print('SELECT ROW_COUNT() AS changed_accounts;')
print('ROLLBACK; -- change to COMMIT only after confirming exactly one reviewed account')
