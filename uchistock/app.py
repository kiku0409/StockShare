import sqlite3
import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, abort

app = Flask(__name__)
app.secret_key = 'uchistock-secret-key'

DB_PATH = os.path.join(os.path.dirname(__file__), 'uchistock.db')

LOCATIONS = ['冷蔵庫', '冷凍庫', '常温', 'その他']
MEMBERS = ['母', '父', '私']


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL,
            expiry_date TEXT,
            memo TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS shopping_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT '',
            memo TEXT,
            added_by TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            purchased_by TEXT,
            created_at TEXT NOT NULL,
            purchased_at TEXT,
            added_to_inventory INTEGER NOT NULL DEFAULT 0
        );
    ''')
    conn.commit()
    conn.close()


def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


# ── Inventory ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM inventory_items ORDER BY location, created_at DESC'
    ).fetchall()
    conn.close()

    grouped = {loc: [] for loc in LOCATIONS}
    for row in rows:
        loc = row['location'] if row['location'] in grouped else 'その他'
        grouped[loc].append(row)

    return render_template('index.html', grouped=grouped, locations=LOCATIONS)


@app.route('/inventory/add', methods=['GET', 'POST'])
def inventory_add():
    prefill = {
        'name': request.args.get('name', ''),
        'quantity': request.args.get('quantity', '1'),
        'unit': request.args.get('unit', ''),
    }

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        quantity = request.form.get('quantity', '').strip()
        unit = request.form.get('unit', '').strip()
        location = request.form.get('location', '').strip()
        expiry_date = request.form.get('expiry_date', '').strip()
        memo = request.form.get('memo', '').strip()

        errors = []
        if not name:
            errors.append('商品名を入力してください。')
        if not quantity:
            errors.append('個数を入力してください。')
        else:
            try:
                qty = float(quantity)
                if qty <= 0:
                    errors.append('個数は0より大きい値を入力してください。')
            except ValueError:
                errors.append('個数は数値で入力してください。')
        if location not in LOCATIONS:
            errors.append('保管場所を選択してください。')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('inventory_form.html', locations=LOCATIONS, prefill=request.form)

        conn = get_db()
        conn.execute(
            'INSERT INTO inventory_items (name, quantity, unit, location, expiry_date, memo, created_at) '
            'VALUES (?, ?, ?, ?, ?, ?, ?)',
            (name, float(quantity), unit, location,
             expiry_date or None, memo or None, now())
        )
        conn.commit()
        conn.close()
        flash(f'「{name}」を在庫に追加しました。', 'success')
        return redirect(url_for('index'))

    return render_template('inventory_form.html', locations=LOCATIONS, prefill=prefill)


@app.route('/inventory/delete/<int:item_id>', methods=['POST'])
def inventory_delete(item_id):
    conn = get_db()
    row = conn.execute('SELECT name FROM inventory_items WHERE id = ?', (item_id,)).fetchone()
    if not row:
        conn.close()
        abort(404)
    conn.execute('DELETE FROM inventory_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    flash(f'「{row["name"]}」を削除しました。', 'success')
    return redirect(url_for('index'))


# ── Shopping ───────────────────────────────────────────────────────────────

@app.route('/shopping')
def shopping():
    conn = get_db()
    pending = conn.execute(
        'SELECT * FROM shopping_items WHERE status = ? ORDER BY created_at DESC',
        ('pending',)
    ).fetchall()
    purchased = conn.execute(
        'SELECT * FROM shopping_items WHERE status = ? ORDER BY purchased_at DESC',
        ('purchased',)
    ).fetchall()
    conn.close()
    return render_template('shopping.html', pending=pending, purchased=purchased, members=MEMBERS)


@app.route('/shopping/add', methods=['GET', 'POST'])
def shopping_add():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        quantity = request.form.get('quantity', '').strip()
        unit = request.form.get('unit', '').strip()
        memo = request.form.get('memo', '').strip()
        added_by = request.form.get('added_by', '').strip()

        errors = []
        if not name:
            errors.append('商品名を入力してください。')
        if not quantity:
            errors.append('個数を入力してください。')
        else:
            try:
                qty = float(quantity)
                if qty <= 0:
                    errors.append('個数は0より大きい値を入力してください。')
            except ValueError:
                errors.append('個数は数値で入力してください。')
        if added_by not in MEMBERS:
            errors.append('追加した人を選択してください。')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('shopping_form.html', members=MEMBERS, prefill=request.form)

        conn = get_db()
        conn.execute(
            'INSERT INTO shopping_items (name, quantity, unit, memo, added_by, status, created_at) '
            'VALUES (?, ?, ?, ?, ?, ?, ?)',
            (name, float(quantity), unit, memo or None, added_by, 'pending', now())
        )
        conn.commit()
        conn.close()
        flash(f'「{name}」を買い物リストに追加しました。', 'success')
        return redirect(url_for('shopping'))

    return render_template('shopping_form.html', members=MEMBERS, prefill={})


@app.route('/shopping/purchase/<int:item_id>', methods=['POST'])
def shopping_purchase(item_id):
    purchased_by = request.form.get('purchased_by', '').strip()
    if purchased_by not in MEMBERS:
        flash('購入者を選択してください。', 'error')
        return redirect(url_for('shopping'))

    conn = get_db()
    row = conn.execute('SELECT * FROM shopping_items WHERE id = ?', (item_id,)).fetchone()
    if not row:
        conn.close()
        abort(404)
    conn.execute(
        'UPDATE shopping_items SET status = ?, purchased_by = ?, purchased_at = ? WHERE id = ?',
        ('purchased', purchased_by, now(), item_id)
    )
    conn.commit()
    conn.close()
    flash(f'「{row["name"]}」を購入済みにしました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/delete/<int:item_id>', methods=['POST'])
def shopping_delete(item_id):
    conn = get_db()
    row = conn.execute('SELECT name FROM shopping_items WHERE id = ?', (item_id,)).fetchone()
    if not row:
        conn.close()
        abort(404)
    conn.execute('DELETE FROM shopping_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    flash(f'「{row["name"]}」を削除しました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/add-to-inventory/<int:item_id>')
def shopping_add_to_inventory(item_id):
    conn = get_db()
    row = conn.execute(
        'SELECT * FROM shopping_items WHERE id = ? AND status = ?',
        (item_id, 'purchased')
    ).fetchone()
    if not row:
        conn.close()
        abort(404)
    conn.execute(
        'UPDATE shopping_items SET added_to_inventory = 1 WHERE id = ?',
        (item_id,)
    )
    conn.commit()
    conn.close()
    return redirect(url_for('inventory_add',
                            name=row['name'],
                            quantity=_fmt_qty(row['quantity']),
                            unit=row['unit']))


def _fmt_qty(qty):
    return int(qty) if qty == int(qty) else qty


@app.context_processor
def inject_now():
    return {'now_str': datetime.now().strftime('%Y-%m-%d')}


init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
