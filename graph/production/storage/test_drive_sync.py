import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).parents[3] / 'scripts' / 'driveSync.py'
SPEC = importlib.util.spec_from_file_location('drive_sync', SCRIPT)
drive_sync = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(drive_sync)

class Request:
    def __init__(self, value): self.value = value
    def execute(self): return self.value

class Files:
    def __init__(self, meta): self.meta = meta; self.created = 0; self.updated = 0
    def get(self, **_): return Request(self.meta)
    def create(self, **_): self.created += 1; return Request({'id': self.meta['id']})
    def update(self, **_): self.updated += 1; return Request({'id': self.meta['id']})

class Service:
    def __init__(self, meta): self.resource = Files(meta)
    def files(self): return self.resource

class VerifiedUploadTests(unittest.TestCase):
    def item(self, file, md5='abc'):
        return {'localPath': str(file), 'remoteSubpath': '03_EPISODE_SAVES/EP/images/a.bin', 'md5': md5, 'sizeBytes': file.stat().st_size}

    def test_already(self):
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'a.bin';file.write_bytes(b'abc');service=Service({'id':'1','md5Checksum':'abc','size':'3'})
            with patch.object(drive_sync,'ensure_remote_path',return_value='folder'),patch.object(drive_sync,'find_remote_file',return_value=service.resource.meta):
                result=drive_sync.process_verified_items(service,'root',[self.item(file)])
            self.assertEqual(result['items'][0]['status'],'already')

    def test_uploaded(self):
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'a.bin';file.write_bytes(b'abc');service=Service({'id':'2','md5Checksum':'abc','size':'3'})
            with patch.object(drive_sync,'ensure_remote_path',return_value='folder'),patch.object(drive_sync,'find_remote_file',return_value=None),patch.object(drive_sync,'MediaFileUpload',return_value=object()):
                result=drive_sync.process_verified_items(service,'root',[self.item(file)])
            self.assertEqual(result['items'][0]['status'],'uploaded');self.assertEqual(service.resource.created,1)

    def test_verify_mismatch(self):
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'a.bin';file.write_bytes(b'abc');service=Service({'id':'3','md5Checksum':'different','size':'3'})
            with patch.object(drive_sync,'ensure_remote_path',return_value='folder'),patch.object(drive_sync,'find_remote_file',return_value=service.resource.meta):
                result=drive_sync.process_verified_items(service,'root',[self.item(file)],upload=False)
            self.assertEqual(result['items'][0]['status'],'mismatch')

if __name__ == '__main__': unittest.main()
