import os

with open("css/styles.css", "r") as f:
    lines = f.readlines()

def get_lines(start, end):
    return "".join(lines[start-1:end])

base_css = get_lines(1, 42) + get_lines(43, 113) + get_lines(350, 395) + get_lines(540, 599) + get_lines(696, 703)
reproductor_css = get_lines(114, 179)
historia_css = get_lines(180, 349) + get_lines(396, 432) + get_lines(760, 822) + get_lines(849, 861) + get_lines(888, 896)
sorpresa_css = get_lines(433, 539) + get_lines(823, 836)
juegos_css = get_lines(600, 695) + get_lines(837, 848) + get_lines(863, 887)
inicio_css = get_lines(705, 759)

with open("css/base.css", "w") as f: f.write(base_css)
with open("css/reproductor.css", "w") as f: f.write(reproductor_css)
with open("css/historia.css", "w") as f: f.write(historia_css)
with open("css/sorpresa.css", "w") as f: f.write(sorpresa_css)
with open("css/juegos.css", "w") as f: f.write(juegos_css)
with open("css/inicio.css", "w") as f: f.write(inicio_css)

main_css = """@import url('base.css');
@import url('inicio.css');
@import url('historia.css');
@import url('sorpresa.css');
@import url('juegos.css');
@import url('reproductor.css');
"""
with open("css/styles.css", "w") as f: f.write(main_css)
