"""Genera sw.js con la lista de archivos de la app para que funcione sin internet.
Ejecutar después de cambiar fotos, audios, video o index.html:  python3 build-sw.py"""
import hashlib, json, os
ROOT = os.path.dirname(os.path.abspath(__file__))
CORE, REST = ['./', 'index.html', 'manifest.json'], []
h = hashlib.sha1()
for d in ('img', 'audio', 'video'):
    for base, _, files in os.walk(os.path.join(ROOT, d)):
        for f in sorted(files):
            p = os.path.relpath(os.path.join(base, f), ROOT).replace(os.sep, '/')
            (CORE if (d == 'img' and base.endswith('img')) else REST).append(p)
for p in sorted(set(CORE + REST)):
    fp = os.path.join(ROOT, p)
    if os.path.isfile(fp):
        h.update(p.encode()); h.update(open(fp, 'rb').read())
ver = h.hexdigest()[:10]
tpl = open(os.path.join(ROOT, 'sw.template.js')).read()
out = tpl.replace('__VERSION__', ver).replace('__CORE__', json.dumps(CORE)).replace('__REST__', json.dumps(sorted(REST)))
open(os.path.join(ROOT, 'sw.js'), 'w').write(out)
print('sw.js', ver, len(CORE), 'core +', len(REST), 'resto')
