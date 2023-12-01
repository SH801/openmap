
import os.path
import sys
from osgeo import gdal
import requests 
from PIL import Image 
gdal.UseExceptions()

boundingbox = [[80000,4000], [656000,665000]]
# boundingbox = [[400000,100000],[500000,200000]]
# Iteration size: Width = 1440, Height = 1653
# No of items = 2.38M 
# However a lot of those are sea

baseexport = '/Volumes/GIS/tiles/'  
basemerge = '/Volumes/Backup/merged/'
increment = 400
x = boundingbox[0][0]
y = boundingbox[0][1]
while( y < boundingbox[1][1]):
    # If last file for this iteration exists, skip to next iteration
    mergedfile = basemerge + str(y) + "," + str(y + increment) + '.tif'
    if os.path.isfile(mergedfile) is True: 
        print("Found merged file, skipping to next row", y)
        y += increment
        continue

    lastfile = baseexport + "655600," + str(y) + ",656000," + str(y + increment) + '.tif'
    if os.path.isfile(lastfile) is False: 
        print("No last file found, quitting merge process", y)
        sys.exit(1)

    print("Collecting source files for merge at y position:", y)
    mergearray = []
    problemsfound = False
    while (x < boundingbox[1][0]):
        bbox = str(x) + "," + str(y) + "," + str(x + increment) + "," + str(y + increment)
        outputfile = baseexport + bbox + '.tif'
        if os.path.isfile(outputfile) is False:
            print("Missing file for bbox", bbox, "so quitting")
            sys.exit(1)
        try:
            geotif = gdal.Open(outputfile)
            srcband = geotif.GetRasterBand(1)
            stats = srcband.GetStatistics(True, True)
            maxvalue = stats[1]
            if maxvalue > 0:
                print("Positive max value", maxvalue, "adding", bbox)
                mergearray.append(outputfile)
        except RuntimeError:
            print("RuntimeError", outputfile)
            problemsfound = True

        x += increment
    if (len(mergearray) > 0) and (problemsfound is False):
        vrt = gdal.BuildVRT("merged.vrt", mergearray)
        gdal.Translate(mergedfile, vrt)
        vrt = None
        print("Finished merging row")
    else:
        print("Problems found or no tiles above sea-level, so not merging tiles")
    y += increment
    x = boundingbox[0][0]

  
