import os
import struct
import zlib
from pathlib import Path


def write_png(path: str, width: int, height: int, color: tuple[int, int, int]):
    rows = []
    for _ in range(height):
        row = b'\x00' + bytes(color[0:3]) * width
        rows.append(row)

    raw_data = b''.join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack('!I', len(data))
            + tag
            + data
            + struct.pack('!I', zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw_data, 9))
        + chunk(b'IEND', b'')
    )

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_bytes(png)


if __name__ == '__main__':
    write_png('assets/icon-192.png', 192, 192, (15, 23, 42))
    write_png('assets/icon-512.png', 512, 512, (15, 23, 42))
    print('Icons created successfully.')
