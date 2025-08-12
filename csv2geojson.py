import csv
import json
import argparse
import pycountry
import re


pycountry.countries.add_entry(alpha_2="XK", alpha_3="XKX", name="Kosovo", numeric="926", flag="🇽🇰")

def get_country_from_file(country_file, year):
    if country_file == "all_countries":
        return f"All Countries 🗺️ ({year})"
    else:
        aux = pycountry.countries.get(alpha_3=country_file[:3])
        return f"{aux.name} {aux.flag} ({year})"


def csv_to_geojson(csv_path, geojson_path):
    features = []
    year = int(re.search(r'(?<!\d)(19|20)\d{2}(?!\d)', csv_path).group())
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            try:
                lat = float(row['weighted_lat'])
                lon = float(row['weighted_lon'])
                properties = {
                    'country': get_country_from_file(row['country_file'], year),
                    'population': int(float(row['total_population']))
                }
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]  # GeoJSON uses [lon, lat]
                    },
                    "properties": properties
                }
                features.append(feature)
            except (ValueError, KeyError) as e:
                print(f"Skipping invalid row: {row} ({e})")

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)

    print(f"GeoJSON saved to {geojson_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert CSV to GeoJSON.')
    parser.add_argument('csvfile', help='Path to the input CSV file')
    parser.add_argument('geojsonfile', help='Path to output GeoJSON file')

    args = parser.parse_args()

    csv_to_geojson(args.csvfile, args.geojsonfile)

if __name__ == "__main__":
    main()
