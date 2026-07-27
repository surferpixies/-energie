import re
import pathlib
import sys

source = pathlib.Path('app.js').read_text(encoding='utf-8')
start = source.index('function snackIconForText(text)')
end = source.index('\nfunction mealIcon', start)
func_source = source[start:end]

ns = {}
exec(func_source, ns)
snackIconForText = ns['snackIconForText']

cases = [
    ("melon d'eau", "🍉"),
    ("pastèque", "🍉"),
    ("craquelin + fromage de chèvre et brie", "🧀"),
    ("chips", "🥨"),
    ("yaourt grec", "🥣"),
    ("brocoli", "🥗"),
]

for text, expected in cases:
    actual = snackIconForText(text)
    print(text, '=>', actual)
    if actual != expected:
        print('FAILED', text, actual, expected)
        sys.exit(1)

print('snack icon tests passed')
