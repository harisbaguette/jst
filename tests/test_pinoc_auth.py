"""Offline checks: automatic refresh must preserve credentials and never log secrets."""
import importlib.util
import json
from pathlib import Path
import tempfile
import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('pinoc', Path(__file__).resolve().parents[1] / 'scripts/pinoc-mcp.py')
pinoc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pinoc)


class PinocAuthTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.file = Path(self.temp.name) / '.credentials.json'
        self.entry = {
            'server_name': 'pinoc', 'server_url': pinoc.SERVER,
            'issuer': 'https://auth.viggle.ai', 'client_id': 'test-client',
            'access_token': 'old-access', 'refresh_token': 'private-refresh',
            'expires_at': int(time.time() * 1000) - 1000,
        }
        self.file.write_text(json.dumps({'pinoc-test': self.entry, 'unrelated': {'keep': 'unchanged'}}), encoding='utf-8')

    def test_expired_login_refreshes_without_browser_and_preserves_other_entries(self):
        def request(args, **kwargs):
            self.assertNotIn('private-refresh', ' '.join(args))
            self.assertIn('private-refresh', kwargs['input'])
            return SimpleNamespace(returncode=0, stdout=json.dumps({
                'access_token': 'new-access', 'refresh_token': 'new-refresh', 'expires_in': 1800,
            }) + '\n200')
        with patch.dict(pinoc.os.environ, {'CODEX_HOME': self.temp.name}), patch.object(pinoc.subprocess, 'run', side_effect=request):
            self.assertEqual(pinoc.credentials(), 'new-access')
        stored = json.loads(self.file.read_text(encoding='utf-8'))
        self.assertEqual(stored['unrelated'], {'keep': 'unchanged'})
        self.assertEqual(stored['pinoc-test']['refresh_token'], 'new-refresh')
        self.assertGreater(stored['pinoc-test']['expires_at'], time.time() * 1000 + 1_700_000)

    def test_failed_refresh_keeps_existing_file_and_hides_response_secrets(self):
        before = self.file.read_bytes()
        response = SimpleNamespace(returncode=0, stdout='private-refresh was rejected\n400')
        with patch.object(pinoc.subprocess, 'run', return_value=response):
            with self.assertRaises(RuntimeError) as error:
                pinoc.refresh_stored_credentials(self.file, 'pinoc-test', self.entry)
        self.assertNotIn('private-refresh', str(error.exception))
        self.assertEqual(self.file.read_bytes(), before)

    def test_valid_login_does_not_refresh(self):
        self.entry['expires_at'] = int(time.time() * 1000) + 600_000
        self.file.write_text(json.dumps({'pinoc-test': self.entry}), encoding='utf-8')
        with patch.dict(pinoc.os.environ, {'CODEX_HOME': self.temp.name}), patch.object(pinoc.subprocess, 'run') as run:
            self.assertEqual(pinoc.credentials(), 'old-access')
            run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
