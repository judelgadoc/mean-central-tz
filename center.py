import os
import rasterio
import numpy as np

root_dir = "data/1km"

weighted_lat_sum = 0.0
weighted_lon_sum = 0.0
total_population = 0.0

for subdir, _, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".tif"):
            path = os.path.join(subdir, file)
            try:
                with rasterio.open(path) as src:
                    data = src.read(1, masked=True)
                    transform = src.transform

                    rows, cols = np.where(~data.mask)
                    for row, col in zip(rows, cols):
                        pop = data[row, col]
                        if pop <= 0:
                            continue
                        lon, lat = rasterio.transform.xy(transform, row, col)
                        weighted_lat_sum += lat * pop
                        weighted_lon_sum += lon * pop
                        total_population += pop
            except Exception as e:
                print(f"Error reading {file}: {e}")

# Avoid division by zero
if total_population > 0:
    mean_lat = weighted_lat_sum / total_population
    mean_lon = weighted_lon_sum / total_population
    print(f"Population-weighted mean coordinate: lat = {mean_lat:.6f}, lon = {mean_lon:.6f}")
else:
    print("No valid population data found.")

