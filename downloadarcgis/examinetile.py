from osgeo import gdal

image = gdal.Open('/Volumes/GIS/tiles/84800,5200,85200,5600.tif')
print(image.RasterCount, image.RasterXSize, image.RasterYSize)
img = image.GetRasterBand(1)
print(img.GetStatistics(True, True))