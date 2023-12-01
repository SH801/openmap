import pickle
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
problemfiles = []
validfiles = set()
validrows = set()
validfilesstore = "validfiles.pickle"
validrowsstore = "validrows.pickle"
# if os.path.isfile(validfilesstore) is True:
#     with open(validfilesstore, 'rb') as handle:
#         validfiles = pickle.load(handle)
if os.path.isfile(validrowsstore) is True:
    with open(validrowsstore, 'rb') as handle:
        validrows = pickle.load(handle)

while( y < boundingbox[1][1]):
    print("Checking source files for y position:", y)
    lastfile = baseexport + "655600," + str(y) + ",656000," + str(y + increment) + '.tif'
    mergedfile = basemerge + str(y) + "," + str(y + increment) + '.tif'

    if os.path.isfile(mergedfile):
        if os.path.isfile(lastfile) is False:
            os.remove(mergedfile)
        else:
            mergedtimestamp = os.path.getmtime(mergedfile)
            lasttimestamp = os.path.getmtime(lastfile)
            if (mergedtimestamp - lasttimestamp) < 0:
                print("Merged file created before last mosaic piece tile - need to remove merged file")
                os.remove(mergedfile)

    problemsfound = False
    # if y not in validrows:
    if True:
        while (x < boundingbox[1][0]):
            bbox = str(x) + "," + str(y) + "," + str(x + increment) + "," + str(y + increment)
            outputfile = baseexport + bbox + '.tif'
            if outputfile not in validfiles:
                if os.path.isfile(outputfile) is True:
                    try:
                        geotif = gdal.Open(outputfile)
                        srcband = geotif.GetRasterBand(1)
                        stats = srcband.GetStatistics(True, True)
                        maxvalue = stats[1]
                        validfiles.add(outputfile)
                    except RuntimeError:
                        print("Error opening so deleting", outputfile)
                        problemfiles.append(outputfile)
                        os.remove(outputfile)
                        problemsfound = True

            x += increment
        print("Finished row")
        if problemsfound:
            print("Problem files in row so deleting lastfile", lastfile)
            os.remove(lastfile)
            print("Problem files in row so deleting mergedfile", mergedfile)
            os.remove(mergedfile)
        else:
            validrows.add(y)
        # with open(validfilesstore, 'wb') as handle:
        #     print("Number of valid files", len(validfiles))
        #     pickle.dump(validfiles, handle, protocol=pickle.HIGHEST_PROTOCOL)
        print("Saving valid rows")
        with open(validrowsstore, 'wb') as handle:
            pickle.dump(validrows, handle, protocol=pickle.HIGHEST_PROTOCOL)
        print("Valid rows saved")

    y += increment
    x = boundingbox[0][0]

print("Number of problem files", len(problemfiles))
  
