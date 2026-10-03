#!/usr/bin/env python3
"""Servidor estático mínimo para jogar no navegador.

    python3 serve.py            ->  http://localhost:8080/
    python3 serve.py 9000       ->  http://localhost:9000/

Serve só o jogo (index.html), o README e a pasta docs/ — não expõe src/ nem dev/.
Servido por http(s) o jogo ganha uma origem "de verdade": o salvamento (localStorage)
e o suporte a controle (Gamepad API) funcionam normalmente.
"""
import http.server, os, sys

ALLOW = ('/', '/index.html', '/README.md')


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
                      '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8'}

    def _permitido(self):
        p = self.path.split('?', 1)[0].split('#', 1)[0]
        return p in ALLOW or p.startswith('/docs/')

    def do_GET(self):
        if not self._permitido():
            return self.send_error(404)
        super().do_GET()

    def do_HEAD(self):
        if not self._permitido():
            return self.send_error(404)
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')   # sempre a versão mais recente do jogo
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    srv = http.server.ThreadingHTTPServer(('0.0.0.0', porta), Handler)
    print(f'120 Espadas em http://localhost:{porta}/   (Ctrl+C para parar)', flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
