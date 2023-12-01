
import os.path
import sys
from osgeo import gdal
import requests 
from PIL import Image 
gdal.UseExceptions()

boundingbox = [[80000,4800], [656000,665000]]
# boundingbox = [[400000,100000],[500000,200000]]
# Iteration size: Width = 1440, Height = 1653
# No of items = 2.38M 
# However a lot of those are sea

basemerge = '/Volumes/Backup/merged/'
finalmerge = basemerge + 'england.tif'
increment = 400
y = boundingbox[0][1]
finaltiles = []
while( y < boundingbox[1][1]):
    # If merged file for this row doesn't exist, quit
    mergedfile = basemerge + str(y) + "," + str(y + increment) + '.tif'
    if os.path.isfile(mergedfile) is False: 
        print("Final row file missing, quitting...", y)
        sys.exit(1)

    print("Collecting final file for row at y position:", y)
    finaltiles.append(mergedfile)
    y += increment

print("Attempting to merge all final row GeoTIFFs")
vrt = gdal.BuildVRT("merged.vrt", finaltiles)
gdal.Translate(finalmerge, vrt)
vrt = None
print("Finished merging all final row GeoTIFFs")

  
