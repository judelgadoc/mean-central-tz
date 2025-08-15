#!/bin/bash

INPUT_DIR="$1"
OUTPUT_DIR="$2"
mkdir -p "$OUTPUT_DIR/compressed"
mkdir -p "$OUTPUT_DIR/tiles"

echo "COMPRESSING.."

for f in "$INPUT_DIR"/*.tif; do
    OUT_FILE="$OUTPUT_DIR/compressed/$(basename "$f")"
    if [ -f "$OUT_FILE" ]; then
        echo "Skipping compression, $OUT_FILE already exists."
    else
        echo "Compressing $f ..."
        gdal_translate \
            -co COMPRESS=ZSTD \
            -co TILED=YES \
            -co BIGTIFF=YES \
            "$f" "$OUT_FILE"
    fi
done

echo "MERGING..."

if [ -f "$OUTPUT_DIR/merged.tif" ]; then
    echo "Skipping merge, $OUTPUT_DIR/merged.tif already exists."
else
gdalbuildvrt "$OUTPUT_DIR/merged.vrt" "$OUTPUT_DIR/compressed/"*.tif

gdal_translate \
    -of GTiff \
    -co COMPRESS=ZSTD \
    -co TILED=YES \
    -co BIGTIFF=YES \
    "$OUTPUT_DIR/merged.vrt" "$OUTPUT_DIR/merged.tif"

gdaladdo -r average "$OUTPUT_DIR/merged.tif" 2 4 8 16 32 64
fi

echo "COLORING..."

COLORMAP_FILE="colormap.txt"

gdaldem color-relief "$OUTPUT_DIR/merged.tif" "$COLORMAP_FILE" "$OUTPUT_DIR/merged_color.tif" \
    -of GTiff -co COMPRESS=ZSTD -co TILED=YES -alpha

#gdal_translate "$OUTPUT_DIR/merged_color.tif" "$OUTPUT_DIR/merged_color_cog.tif" \
#    -of COG -co COMPRESS=ZSTD -co TILED=YES

echo "TILING.."

gdal_translate -of VRT -ot Byte -scale "$OUTPUT_DIR/merged_color.tif" "$OUTPUT_DIR/temp_scaled.vrt"

gdal2tiles.py "$OUTPUT_DIR/temp_scaled.vrt" "$OUTPUT_DIR/tiles"

# Cleanup temporary VRT
rm "$OUTPUT_DIR/temp_scaled.vrt"


