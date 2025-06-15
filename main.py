import os
import csv
import rasterio

# Root directory where .tif files are located recursively
root_dir = "data/1km"
results = []

for subdir, _, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".tif"):
            path = os.path.join(subdir, file)
            try:
                with rasterio.open(path) as src:
                    data = src.read(1, masked=True)  # mask NoData values
                    total = data[data > 0].sum()     # exclude invalid/zero values
                    results.append((path, total))
            except Exception as e:
                print(f"Failed to process {path}: {e}")

# Save to CSV
with open("population_totals.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["FilePath", "TotalPopulation"])
    writer.writerows(results)
