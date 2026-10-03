#!/usr/bin/env python3
"""Generate a reviewable, rollback-only cleanup SQL file from explicitly audited IDs.
Never connects to a database; never guesses demo records from dates or names.
"""
import argparse
import json
from pathlib import Path

TABLES = ('exception_reports', 'stop_items', 'trip_stops', 'deferrals', 'order_lines', 'stock_orders', 'trips', 'ops_events', 'planning_conflicts')
def generate(manifest):
    if not isinstance(manifest, dict) or set(manifest) - set(TABLES):
        raise ValueError('Only operational tables are permitted; users/master/schema cannot be deleted')
    sql = ['-- REVIEW ONLY: test on a restored backup first. Final ROLLBACK is intentional.', 'START TRANSACTION;']
    for table in TABLES:
        ids = manifest.get(table, [])
        if not isinstance(ids, list) or any(type(i) is not int or i <= 0 for i in ids) or len(ids) != len(set(ids)):
            raise ValueError('IDs must be unique positive integers: ' + table)
        if ids:
            where = ','.join(str(i) for i in sorted(ids))
            sql += [f'SELECT * FROM `{table}` WHERE id IN ({where}) FOR UPDATE;', f'DELETE FROM `{table}` WHERE id IN ({where});', f'SELECT ROW_COUNT() AS deleted_{table};']
    sql += ['-- Preserve app_users, depots, outlets, vehicles, products and all schema/migrations.', 'ROLLBACK;']
    return '\n'.join(sql) + '\n'
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.write_text(generate(json.loads(args.manifest.read_text())))
    print('Rollback-only SQL generated. Review documented backup and approval steps before applying.')
