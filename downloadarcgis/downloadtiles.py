
import os.path
import requests 
from PIL import Image 

boundingbox = [[80000,4000], [656000,665000]]
# boundingbox = [[400000,100000],[500000,200000]]
# Iteration size: Width = 1440, Height = 1653
# No of items = 2.38M 
# However a lot of those are sea

baseurl = 'https://environment.data.gov.uk/image/rest/services/SURVEY/LIDAR_Composite_1m_DTM_2022_Elevation/ImageServer/exportImage?format=tiff&f=image' 
testurl = 'https://environment.data.gov.uk/image/rest/services/SURVEY/LIDAR_Composite_1m_DTM_2022_Elevation/ImageServer/exportImage?bbox=400000,100000,400400,100400&format=tiff&f=image' 
baseexport = '/Volumes/GIS/tiles/'  
increment = 400
x = boundingbox[0][0]
y = boundingbox[0][1]
while( y < boundingbox[1][1]):
    # If last file for this iteration exists, skip to next iteration
    lastfile = baseexport + "655600," + str(y) + ",656000," + str(y + increment) + '.tif'
    if os.path.isfile(lastfile) is True: 
        print("Found last file, skipping to next row", y)
        y += increment
        continue
    while (x < boundingbox[1][0]):
        bbox = str(x) + "," + str(y) + "," + str(x + increment) + "," + str(y + increment)
        url = baseurl + '&bbox=' + bbox
        print("Retrieving", bbox)
        outputfile = baseexport + bbox + '.tif'
        if os.path.isfile(outputfile) is False:
            data = requests.get(url).content 
            f = open(outputfile,'wb')   
            f.write(data) 
            f.close() 
        x += increment
    print("Finished row")
    y += increment
    x = boundingbox[0][0]

  
