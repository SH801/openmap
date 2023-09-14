from os import walk
from PIL import Image
from PIL.ImageColor import getcolor, getrgb
from PIL.ImageOps import grayscale, invert

def image_tint(src, tint='#ffffff'):
    src = Image.open(src)
    if src.mode not in ['RGB', 'RGBA']:
        raise TypeError('Unsupported source image mode: {}'.format(src.mode))
    src.load()

    # Invert image as black on transparent background
    r, g, b, a = src.split()
    def invert(image):
        return image.point(lambda p: 255 - p)
    r, g, b = map(invert, (r, g, b))
    img2 = Image.merge(src.mode, (r, g, b, a))
    tr, tg, tb = getrgb(tint)
    tl = getcolor(tint, "L")  # tint color's overall luminosity
    if not tl: tl = 1  # avoid division by zero
    tl = float(tl)  # compute luminosity preserving tint factors
    sr, sg, sb = map(lambda tv: tv/(2 * tl), (tr, tg, tb))  # per component
                                                      # adjustments
    # create look-up tables to map luminosity to adjusted tint
    # (using floating-point math only to compute table)
    luts = (tuple(map(lambda lr: int(lr*sr - 1), range(256))) +
            tuple(map(lambda lg: int(lg*sg - 1), range(256))) +
            tuple(map(lambda lb: int(lb*sb - 1), range(256))))
    l = grayscale(img2)  # 8-bit luminosity version of whole image
    if Image.getmodebands(src.mode) < 4:
        merge_args = (src.mode, (l, l, l))  # for RGB verion of grayscale
    else:  # include copy of src image's alpha layer
        a = Image.new("L", src.size)
        a.putdata(src.getdata(3))
        merge_args = (src.mode, (l, l, l, a))  # for RGBA verion of grayscale
        luts += tuple(range(256))  # for 1:1 mapping of copied alpha values

    return Image.merge(*merge_args).point(luts)

if __name__ == '__main__':
    import os
    import sys

    colourlist = {
        'green': '#4CBB17',
        'darkblue': '#00008B',
        'lightblue': '#00FFFF',
        'brown': '#B8860B',
        'purple': '#8A2BE2'
    }

    directory = "frontend/public/static/assets/icon/actionIcons/"
    filenames = next(walk(directory), (None, None, []))[2]
    if '.DS_Store' in filenames: filenames.remove('.DS_Store')
    filenames = [directory + filename for filename in filenames]
    colourkeys = colourlist.keys()
    for colour in colourkeys:
        for filename in filenames:
            print("Colouring", filename, "with colour", colour)
            root, ext = os.path.splitext(filename)
            basename = os.path.basename(filename)[:-len(ext)]
            directory = os.path.dirname(filename)           
            suffix = '_' + colour
            result_image_path = directory + '/coloured/' + basename + suffix + ext
            result = image_tint(filename, colourlist[colour])
            if os.path.exists(result_image_path):  # delete any previous result file
                os.remove(result_image_path)
            result.save(result_image_path)  # file name's extension determines format
            # break

    print('done')