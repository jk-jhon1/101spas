#!/usr/bin/env python3
"""Concatena src/*.js + style.css + template.html em um único arquivo autocontido (index.html)."""
import glob, os, re, sys
root = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(root, 'src')
files = sorted(f for f in os.listdir(src) if re.match(r'^\d+.*\.js$', f))
js = '\n;\n'.join('/* ===== %s ===== */\n' % f + open(os.path.join(src, f), encoding='utf-8').read() for f in files)
css = open(os.path.join(src, 'style.css'), encoding='utf-8').read()
html = open(os.path.join(src, 'template.html'), encoding='utf-8').read()
html = html.replace('/*__STYLE__*/', css).replace('/*__SCRIPT__*/', js.replace('</script>', '<\\/script>'))
out = os.path.join(root, 'index.html')
open(out, 'w', encoding='utf-8').write(html)
open(os.path.join(root, 'dev', 'bundle.js'), 'w', encoding='utf-8').write(js)
print('OK', out, round(len(html) / 1024), 'KB;', len(files), 'módulos')
