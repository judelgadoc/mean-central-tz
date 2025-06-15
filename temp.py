import os
import rasterio
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import matplotlib.pyplot as plt

# === Step 1: Read all .tif population files ===
root_dir = "data/1km"  # Change this to your actual tif directory

points = []

for subdir, _, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".tif"):
            path = os.path.join(subdir, file)
            try:
                with rasterio.open(path) as src:
                    data = src.read(1, masked=True)  # Read as masked array
                    transform = src.transform

                    # Iterate through array and get row, col, value
                    rows, cols = np.where(~data.mask)
                    for row, col in zip(rows, cols):
                        value = data[row, col]
                        if value <= 0:
                            continue  # Skip zero or negative pop
                        lon, lat = rasterio.transform.xy(transform, row, col)
                        points.append((lon, lat, float(value)))
            except Exception as e:
                print(f"Error reading {file}: {e}")

# === Step 2: Build GeoDataFrame from points ===
df = pd.DataFrame(points, columns=["lon", "lat", "population"])
geometry = [Point(xy) for xy in zip(df["lon"], df["lat"])]
gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")

# Clean masked constants if any slipped through
gdf["population"] = gdf["population"].apply(
    lambda x: np.nan if isinstance(x, np.ma.core.MaskedConstant) else x
)
gdf["population"] = gdf["population"].fillna(0)

# === Step 3: Load basemap ===
world = gpd.read_file("data/ne_110m_admin_0_countries/ne_110m_admin_0_countries.shp")

# === Step 4: Plot ===
fig, ax = plt.subplots(figsize=(16, 10))
world.plot(ax=ax, color="lightgrey", edgecolor="white")

gdf.plot(
    ax=ax,
    column="population",
    cmap="viridis",
    markersize=gdf["population"] / 100000,  # Adjust divisor for better size
    legend=True,
    alpha=0.6
)

plt.title("Population Distribution (WorldPop GeoTIFF)")
plt.axis("off")
plt.tight_layout()
plt.show()

