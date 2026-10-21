"""Submit the approved opaque outfit once, keeping credentials out of logs."""
from pathlib import Path
import hashlib
import importlib.util
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
RECORD = ROOT / 'docs/vr-opaque-generation.json'
spec = importlib.util.spec_from_file_location('pinoc', ROOT / 'scripts/pinoc-mcp.py')
pinoc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pinoc)


def call(client, name, arguments):
    result = client.request('tools/call', {'name': name, 'arguments': arguments})
    if result.get('isError'):
        raise RuntimeError('PINOC tool failed: ' + name)
    return result.get('structuredContent') or json.loads(result['content'][0]['text'])


def main():
    if RECORD.exists():
        previous = json.loads(RECORD.read_text(encoding='utf-8'))
        if previous.get('taskId') or previous.get('state') == 'submitting':
            print(json.dumps({'state': previous['state'], 'taskId': previous.get('taskId'), 'duplicate_submission_prevented': True}))
            return
    client = pinoc.Client()
    balance = call(client, 'get_credit_balance', {})
    if balance['total'] < 10:
        raise RuntimeError('Insufficient credits')
    inputs = [ROOT / 'assets/characters/vr-woman-opaque-v1' / name for name in [
        '13-outfit-front.png', '14-outfit-side.png', '15-outfit-back.png']]
    keys = []
    for index, path in enumerate(inputs):
        if index == 0:
            upload = json.loads((OUT / 'upload-front.json').read_text(encoding='utf-8'))['structuredContent']
        else:
            upload = call(client, 'prepare_upload', {'filename': path.name, 'sizeBytes': path.stat().st_size})
        assert upload['method'].upper() == 'PUT'
        config = 'url = ' + json.dumps(upload['url']) + '\n'
        for key, value in upload['headers'].items():
            config += 'header = ' + json.dumps(key + ': ' + value) + '\n'
        result = subprocess.run([
            'curl', '--silent', '--show-error', '--max-time', '90', '--request', 'PUT',
            '--upload-file', str(path), '--config', '-', '--output', 'NUL', '--write-out', '%{http_code}',
        ], input=config, text=True, capture_output=True)
        if result.returncode or not result.stdout.startswith('2'):
            raise RuntimeError('Image upload failed: ' + path.name + ', status ' + result.stdout)
        keys.append(upload['uploadKey'])
        print(json.dumps({'uploaded': path.name, 'bytes': path.stat().st_size}), flush=True)
    record = {
        'date': '2026-10-21', 'state': 'submitting',
        'inputs': [p.relative_to(ROOT).as_posix() for p in inputs],
        'inputSha256': [hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs],
        'options': {'refine': True, 'visibility': 'private'},
        'balanceBefore': balance['total'],
    }
    RECORD.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    generated = call(client, 'generate_character', {'uploadKeys': keys, **record['options']})
    (OUT / 'submission.json').write_text(json.dumps(generated, indent=2) + '\n', encoding='utf-8')
    record.update({'state': 'generating', 'taskId': generated['taskId']})
    if 'creditsCharged' in generated:
        record['creditsCharged'] = generated['creditsCharged']
    RECORD.write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(generated), flush=True)


if __name__ == '__main__':
    main()
