from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
files = {
    'characters/vr-woman-opaque.vsplat': ROOT / 'public/characters/vr-woman-opaque.vsplat',
    'README.md': ROOT / 'docs/vr-opaque-model-readme.md',
    'generation.json': ROOT / 'docs/vr-opaque-generation.json',
    'verification.json': OUT / 'viewer-verification.json',
}
for name in ['idle', 'walk', 'run']:
    files['motions/' + name + '.glb'] = ROOT / 'public/motions' / (name + '.glb')
for name in ['13-outfit-front', '14-outfit-side', '15-outfit-back']:
    files['references/' + name + '.png'] = ROOT / 'assets/characters/vr-woman-opaque-v1' / (name + '.png')
    files['references/' + name + '.prompt.txt'] = ROOT / 'docs/vr-woman-opaque-v1' / (name + '.prompt.txt')
for name in ['model-front', 'model-side', 'model-back', 'face-comparison', 'motion-run', 'mobile']:
    files['previews/' + name + '.png'] = OUT / (name + '.png')
manifest = {'package': 'vr-woman-opaque-3d', 'files': []}
archive = OUT / 'vr-woman-opaque-3d.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, source in files.items():
        data = source.read_bytes()
        z.writestr(name, data)
        manifest['files'].append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    z.writestr('manifest.json', json.dumps(manifest, indent=2) + '\n')
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for item in manifest['files']:
        assert hashlib.sha256(z.read(item['path'])).hexdigest() == item['sha256']
    record = json.loads(z.read('generation.json'))
    assert hashlib.sha256(z.read('characters/vr-woman-opaque.vsplat')).hexdigest() == record['sha256']
    assert json.loads(z.read('verification.json'))['result'] == 'pass'
(OUT / 'package-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'archive': str(archive), 'entries': len(manifest['files']) + 1, 'bytes': archive.stat().st_size, 'crc_and_hashes': 'pass'}))
