"""Serve the built game on loopback only. Python 3 standard library, no packages."""
import argparse
import functools
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen
import webbrowser


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5180)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent / 'dist')
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    if not (root / 'game.html').is_file():
        raise SystemExit('Build not found. Run npm run build first, or extract the complete game package.')

    class Handler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.vsplat': 'application/octet-stream', '.glb': 'model/gltf-binary'}

        def log_message(self, _format, *args):
            pass

    class Server(ThreadingHTTPServer):
        allow_reuse_address = False

        def server_bind(self):
            if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            super().server_bind()

    try:
        server = Server(('127.0.0.1', args.port), functools.partial(Handler, directory=str(root)))
    except OSError as error:
        address = f'http://127.0.0.1:{args.port}/game.html'
        try:
            with urlopen(address, timeout=2) as response:
                same_game = response.read() == (root / 'game.html').read_bytes()
        except OSError:
            same_game = False
        if same_game:
            print(f'Game is already running: {address}', flush=True)
            if not args.no_open:
                webbrowser.open(address)
            return
        raise SystemExit(f'Cannot start local server on port {args.port}: {error}. Try --port 5181.') from error
    address = f'http://127.0.0.1:{server.server_port}/game.html'
    print(f'Open {address}\nKeep this window open while playing. Ctrl+C stops the server.', flush=True)
    if not args.no_open:
        webbrowser.open(address)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
