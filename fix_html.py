with open('C:/Projects/VSCode/sales_salary/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Close operations-container div, close column, close workspace, then add modals outside
old = '''        <div class="op-list" id="operations-container">
 <div class="modal-overlay" id="modal-add-emp">'''

new = '''        <div class="op-list" id="operations-container">
        </div>
    </div>
</div>

<!-- Модалка добавления сотрудника (вне рабочей области) -->
<div class="modal-overlay" id="modal-add-emp">'''

if old in content:
    content = content.replace(old, new, 1)
    print('Fix 1 applied')
else:
    print('Fix 1 pattern NOT found')
    lines = content.split('\n')
    for i, line in enumerate(lines[112:120], start=113):
        print(f'{i}: {repr(line)}')

# Fix 2: Close modal-close-shift properly and add </div> for workspace at end
old2 = '''        <div class="modal-btns"><button class="btn-sale" id="btn-close-shift-final">📠 Подтвердить, напечатать и отправить в архив</button><button class="btn-gray" id="btn-cancel-close-shift">Вернуться в кассу</button></div>
    </div>
</div>

<!-- Экран входа пользователя (второй рубеж) -->'''

new2 = '''        <div class="modal-btns"><button class="btn-sale" id="btn-close-shift-final">📠 Подтвердить, напечатать и отправить в архив</button><button class="btn-gray" id="btn-cancel-close-shift">Вернуться в кассу</button></div>
    </div>
</div>

</div>

<!-- Экран входа пользователя (второй рубеж) -->'''

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Fix 2 applied')
else:
    print('Fix 2 pattern NOT found')

with open('C:/Projects/VSCode/sales_salary/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
