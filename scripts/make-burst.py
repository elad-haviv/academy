import math, pathlib
N = 96
CX = CY = 300.0
R0 = 300 * 0.06      # empty centre
R1 = 300.0
lines = []
for i in range(N):
    a = (i / N) * 2 * math.pi
    x0, y0 = CX + R0 * math.cos(a), CY + R0 * math.sin(a)
    x1, y1 = CX + R1 * math.cos(a), CY + R1 * math.sin(a)
    lines.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}"/>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="presentation">
  <defs>
    <linearGradient id="burst" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#26b9c1"/>
      <stop offset="55%" stop-color="#26b9c1"/>
      <stop offset="100%" stop-color="#096fe0"/>
    </linearGradient>
  </defs>
  <g stroke="url(#burst)" stroke-width="1" stroke-linecap="butt" fill="none">
    {chr(10).join("    " + l for l in lines)}
  </g>
</svg>
'''
p = pathlib.Path('/opt/data/projects/academy/public/img/burst.svg')
p.write_text(svg, encoding='utf-8')
print('burst.svg', p.stat().st_size, 'bytes, rays:', N)
