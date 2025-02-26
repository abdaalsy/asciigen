from PIL import Image
from time import sleep
import requests, sys
import numpy as np

# one char = 8 x 18 px (each pixel is 4:9)

# ASCII_CHARS = [char for char in " .-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@"]
# DARKNESSES = [0, 0.0751, 0.0829, 0.0848, 0.1227, 0.1403, 0.1559, 0.185, 0.2183, 0.2417, 0.2571, 0.2852, 0.2902, 0.2919, 0.3099, 0.3192, 0.3232, 0.3294, 0.3384, 0.3609, 0.3619, 0.3667, 0.3737, 0.3747, 0.3838, 0.3921, 0.396, 0.3984, 0.3993, 0.4075, 0.4091, 0.4101, 0.42, 0.423, 0.4247, 0.4274, 0.4293, 0.4328, 0.4382, 0.4385, 0.442, 0.4473, 0.4477, 0.4503, 0.4562, 0.458, 0.461, 0.4638, 0.4667, 0.4686, 0.4693, 0.4703, 0.4833, 0.4881, 0.4944, 0.4953, 0.4992, 0.5509, 0.5567, 0.5569, 0.5591, 0.5602, 0.5602, 0.565, 0.5776, 0.5777, 0.5818, 0.587, 0.5972, 0.5999, 0.6043, 0.6049, 0.6093, 0.6099, 0.6465, 0.6561, 0.6595, 0.6631, 0.6714, 0.6759, 0.6809, 0.6816, 0.6925, 0.7039, 0.7086, 0.7235, 0.7302, 0.7332, 0.7602, 0.7834, 0.8037, 0.9999]

mirrored = lambda real : np.array([np.flip(line) for line in real])

def web_retrieve(url: str):
    res = requests.get(url, allow_redirects=True)
    ct = res.headers.get("Content-Type").split('/')
    if ct[0] != "image":
        print("The link you entered does not lead to an image.")
        sleep(3)
        sys.exit()
    ext = ct[1]
    f = open(f"image.{ext}", "wb")
    f.write(res.content)
    f.close()
    return f"image.{ext}"

def ascii_gen(img: Image, width=50):
    n_width = width
    n_height = int(n_width * (img.size[1] / img.size[0]))
    img = img.resize((n_width, n_height))

    ASCII_CHARS = ["@", "$", "?", "*", "+", ";", "."]
    ASCII_CHARS.reverse()

    ascii_all = ""
    for pix in img.getdata():
        r, g, b = pix[0], pix[1], pix[2]
        lum = int((0.2126 * r + 0.7152 * g + 0.0722 * b))
        ascii_all += ASCII_CHARS[lum//37]*2     # using same character twice to compensate narrowing caused by line spacing
    
    line_width = n_width*2 
    ascii_str = ""
    for i in range(0, len(ascii_all), line_width):
        ascii_str += ascii_all[i:i+line_width] + "\n"

    return ascii_str