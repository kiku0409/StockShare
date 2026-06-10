import os
import psycopg2
import psycopg2.extras
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, abort, jsonify
from flask_wtf.csrf import CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix

# api/ の一つ上が uchistock/ ルート
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    template_folder=os.path.join(_ROOT, 'templates'),
    static_folder=os.path.join(_ROOT, 'static'),
    static_url_path='/static',
)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = os.environ.get('SECRET_KEY', 'uchistock-dev-key-change-in-prod')
app.config['WTF_CSRF_TIME_LIMIT'] = None
csrf = CSRFProtect(app)

_DATABASE_URL = os.environ.get('DATABASE_URL', '')
if _DATABASE_URL.startswith('postgres://'):
    _DATABASE_URL = _DATABASE_URL.replace('postgres://', 'postgresql://', 1)

LOCATIONS = ['冷蔵庫', '冷凍庫', '常温', 'その他']
MEMBERS = ['母', '父', '私']


def get_db():
    if not _DATABASE_URL:
        raise RuntimeError('DATABASE_URL 環境変数が設定されていません。')
    return psycopg2.connect(_DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def init_db():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS inventory_items (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    unit TEXT NOT NULL DEFAULT '',
                    location TEXT NOT NULL,
                    expiry_date TEXT,
                    memo TEXT,
                    created_at TEXT NOT NULL
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS shopping_items (
                    id SERIAL PRIMARY KEY,
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
                )
            ''')
        conn.commit()
    finally:
        conn.close()


def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def _fmt_qty(qty):
    return int(qty) if qty == int(qty) else qty


@app.template_filter('fmt_qty')
def fmt_qty_filter(qty):
    return _fmt_qty(qty)


def _validate_item(form):
    errors = []
    name = form.get('name', '').strip()
    quantity = form.get('quantity', '').strip()

    if not name:
        errors.append('商品名を入力してください。')

    qty_val = None
    if not quantity:
        errors.append('個数を入力してください。')
    else:
        try:
            qty_val = float(quantity)
            if qty_val <= 0:
                errors.append('個数は0より大きい値を入力してください。')
        except ValueError:
            errors.append('個数は数値で入力してください。')

    return errors, name, qty_val


# ── Inventory ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM inventory_items ORDER BY location, created_at DESC')
            rows = cur.fetchall()
    finally:
        conn.close()

    grouped = {loc: [] for loc in LOCATIONS}
    for row in rows:
        loc = row['location'] if row['location'] in grouped else 'その他'
        grouped[loc].append(row)

    return render_template('index.html', grouped=grouped, locations=LOCATIONS)


@app.route('/inventory/add', methods=['GET', 'POST'])
def inventory_add():
    from_shopping = request.args.get('from_shopping', '')
    prefill = {
        'name': request.args.get('name', ''),
        'quantity': request.args.get('quantity', '1'),
        'unit': request.args.get('unit', ''),
        'from_shopping': from_shopping,
    }

    if request.method == 'POST':
        errors, name, qty_val = _validate_item(request.form)
        unit = request.form.get('unit', '').strip()
        location = request.form.get('location', '').strip()
        expiry_date = request.form.get('expiry_date', '').strip()
        memo = request.form.get('memo', '').strip()
        from_shopping_id = request.form.get('from_shopping', '').strip()

        if location not in LOCATIONS:
            errors.append('保管場所を選択してください。')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('inventory_form.html', locations=LOCATIONS,
                                   prefill=request.form, edit_mode=False)

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT id FROM inventory_items WHERE name = %s AND location = %s',
                    (name, location)
                )
                if cur.fetchone():
                    flash(f'「{name}」はすでに{location}に登録されています。個数を確認してください。', 'warning')

                cur.execute(
                    'INSERT INTO inventory_items (name, quantity, unit, location, expiry_date, memo, created_at) '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                    (name, qty_val, unit, location, expiry_date or None, memo or None, now())
                )
                if from_shopping_id:
                    try:
                        cur.execute(
                            'UPDATE shopping_items SET added_to_inventory = 1 WHERE id = %s',
                            (int(from_shopping_id),)
                        )
                    except ValueError:
                        app.logger.warning('from_shopping_id の更新失敗 (値: %s)', from_shopping_id)
            conn.commit()
        finally:
            conn.close()

        flash(f'「{name}」を在庫に追加しました。', 'success')
        return redirect(url_for('shopping') if from_shopping_id else url_for('index'))

    return render_template('inventory_form.html', locations=LOCATIONS,
                           prefill=prefill, edit_mode=False)


@app.route('/inventory/edit/<int:item_id>', methods=['GET', 'POST'])
def inventory_edit(item_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM inventory_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        abort(404)

    if request.method == 'POST':
        errors, name, qty_val = _validate_item(request.form)
        unit = request.form.get('unit', '').strip()
        location = request.form.get('location', '').strip()
        expiry_date = request.form.get('expiry_date', '').strip()
        memo = request.form.get('memo', '').strip()

        if location not in LOCATIONS:
            errors.append('保管場所を選択してください。')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('inventory_form.html', locations=LOCATIONS,
                                   prefill=request.form, edit_mode=True, item_id=item_id)

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE inventory_items SET name=%s, quantity=%s, unit=%s, location=%s, '
                    'expiry_date=%s, memo=%s WHERE id=%s',
                    (name, qty_val, unit, location, expiry_date or None, memo or None, item_id)
                )
            conn.commit()
        finally:
            conn.close()

        flash(f'「{name}」を更新しました。', 'success')
        return redirect(url_for('index'))

    prefill = {
        'name': row['name'],
        'quantity': _fmt_qty(row['quantity']),
        'unit': row['unit'],
        'location': row['location'],
        'expiry_date': row['expiry_date'] or '',
        'memo': row['memo'] or '',
    }
    return render_template('inventory_form.html', locations=LOCATIONS,
                           prefill=prefill, edit_mode=True, item_id=item_id)


@app.route('/inventory/delete/<int:item_id>', methods=['POST'])
def inventory_delete(item_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT name FROM inventory_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
            if not row:
                abort(404)
            cur.execute('DELETE FROM inventory_items WHERE id = %s', (item_id,))
        conn.commit()
    finally:
        conn.close()
    flash(f'「{row["name"]}」を削除しました。', 'success')
    return redirect(url_for('index'))


@app.route('/inventory/update-qty/<int:item_id>', methods=['POST'])
def inventory_update_qty(item_id):
    try:
        delta = int(request.form.get('delta', '0'))
    except ValueError:
        return jsonify({'error': 'invalid'}), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM inventory_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({'error': 'not found'}), 404

            new_qty = row['quantity'] + delta
            if new_qty <= 0:
                cur.execute('DELETE FROM inventory_items WHERE id = %s', (item_id,))
                conn.commit()
                result = jsonify({'deleted': True})
            else:
                cur.execute('UPDATE inventory_items SET quantity = %s WHERE id = %s', (new_qty, item_id))
                conn.commit()
                result = jsonify({'quantity': _fmt_qty(new_qty)})
    finally:
        conn.close()

    return result


# ── Shopping ───────────────────────────────────────────────────────────────

@app.route('/shopping')
def shopping():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT * FROM shopping_items WHERE status = %s ORDER BY created_at DESC',
                ('pending',)
            )
            pending = cur.fetchall()
            cur.execute(
                'SELECT * FROM shopping_items WHERE status = %s ORDER BY purchased_at DESC',
                ('purchased',)
            )
            purchased = cur.fetchall()
    finally:
        conn.close()
    return render_template('shopping.html', pending=pending, purchased=purchased, members=MEMBERS)


@app.route('/shopping/add', methods=['GET', 'POST'])
def shopping_add():
    if request.method == 'POST':
        errors, name, qty_val = _validate_item(request.form)
        unit = request.form.get('unit', '').strip()
        memo = request.form.get('memo', '').strip()
        added_by = request.form.get('added_by', '').strip()

        if added_by not in MEMBERS:
            errors.append('追加した人を選択してください。')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('shopping_form.html', members=MEMBERS, prefill=request.form)

        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'INSERT INTO shopping_items (name, quantity, unit, memo, added_by, status, created_at) '
                    'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                    (name, qty_val, unit, memo or None, added_by, 'pending', now())
                )
            conn.commit()
        finally:
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
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM shopping_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
            if not row:
                abort(404)
            cur.execute(
                'UPDATE shopping_items SET status=%s, purchased_by=%s, purchased_at=%s WHERE id=%s',
                ('purchased', purchased_by, now(), item_id)
            )
        conn.commit()
    finally:
        conn.close()

    flash(f'「{row["name"]}」を購入済みにしました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/unpurchase/<int:item_id>', methods=['POST'])
def shopping_unpurchase(item_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM shopping_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
            if not row:
                abort(404)
            cur.execute(
                'UPDATE shopping_items SET status=%s, purchased_by=NULL, purchased_at=NULL WHERE id=%s',
                ('pending', item_id)
            )
        conn.commit()
    finally:
        conn.close()
    flash(f'「{row["name"]}」を未購入に戻しました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/delete/<int:item_id>', methods=['POST'])
def shopping_delete(item_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT name FROM shopping_items WHERE id = %s', (item_id,))
            row = cur.fetchone()
            if not row:
                abort(404)
            cur.execute('DELETE FROM shopping_items WHERE id = %s', (item_id,))
        conn.commit()
    finally:
        conn.close()
    flash(f'「{row["name"]}」を削除しました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/clear-purchased', methods=['POST'])
def shopping_clear_purchased():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS cnt FROM shopping_items WHERE status = 'purchased'")
            count = cur.fetchone()['cnt']
            cur.execute("DELETE FROM shopping_items WHERE status = 'purchased'")
        conn.commit()
    finally:
        conn.close()
    flash(f'購入済みアイテム {count} 件を削除しました。', 'success')
    return redirect(url_for('shopping'))


@app.route('/shopping/add-to-inventory/<int:item_id>')
def shopping_add_to_inventory(item_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT * FROM shopping_items WHERE id = %s AND status = %s',
                (item_id, 'purchased')
            )
            row = cur.fetchone()
            if not row:
                abort(404)
    finally:
        conn.close()
    return redirect(url_for('inventory_add',
                            name=row['name'],
                            quantity=_fmt_qty(row['quantity']),
                            unit=row['unit'],
                            from_shopping=item_id))


@app.route('/api/item-history')
def item_history():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT name, unit, MAX(purchased_at) AS last_bought
                FROM shopping_items
                WHERE status = 'purchased'
                GROUP BY name, unit
                ORDER BY last_bought DESC
                LIMIT 50
            ''')
            rows = cur.fetchall()
    finally:
        conn.close()
    return jsonify([{'name': r['name'], 'unit': r['unit'] or ''} for r in rows])


@app.context_processor
def inject_now():
    return {'now_str': datetime.now().strftime('%Y-%m-%d')}


try:
    init_db()
except Exception as e:
    app.logger.warning('init_db() failed: %s', e)
