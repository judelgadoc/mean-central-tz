import os
import re
import requests
import time
import random
from rich.progress import Progress, BarColumn, DownloadColumn, TextColumn, TimeRemainingColumn, TransferSpeedColumn


HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }


def list_folders(url):
    r = requests.get(url, headers=HEADERS)
    return sorted(set(re.findall(r'href="([A-Z]{3})/"', r.text)))

def list_tif_files(url):
    r = requests.get(url, headers=HEADERS)
    return re.findall(r'href="([^"]+\.tif)"', r.text)

def download_file(url, tif_file, download_dir):
    with requests.get(url, headers=HEADERS, stream=True) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
    
        with open(os.path.join(download_dir,tif_file), "wb") as f, Progress(
            TextColumn("[bold blue]{task.fields[filename]}", justify="right"),
            BarColumn(bar_width=None),
            DownloadColumn(),
            TransferSpeedColumn(),
            TimeRemainingColumn(),
        ) as progress:
    
            task = progress.add_task("download", filename=tif_file, total=total)
    
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive chunks
                    f.write(chunk)
                    progress.update(task, advance=len(chunk))

def download_countries(base_url, download_dir):
    countries = list_folders(base_url)
    print(f"Found countries: {countries}")
    time.sleep(5)

    for country in countries:
        country_lower = country.lower()
        already_downloaded = any(
            f.endswith(".tif") and country_lower in f.lower()
            for f in os.listdir(download_dir)
        )

        if already_downloaded:
            print(f"Skipping country {country}: already has downloaded files (FAST CHECK)")
            continue

        if "1km" in download_dir:
            constrained_url = f"{BASE_URL}{country}/v1/1km_ua/constrained/"
        else: 
            constrained_url = f"{BASE_URL}{country}/v1/100m/constrained/"

        print(f"\nChecking {constrained_url}")
        tif_files = list_tif_files(constrained_url)
        time.sleep(5)
        if not tif_files:
            print(f"No .tif files found for {country}")
            continue

        for tif_file in tif_files:
            file_url = constrained_url + tif_file
            local_path = os.path.join(download_dir, tif_file)
            if os.path.exists(local_path):
                print(f"Skipping already downloaded: {tif_file}")
                continue
            print(f"Downloading {file_url}")
            try:
                download_file(file_url, tif_file, download_dir)
                time.sleep(random.uniform(12,15))
            except Exception as e:
                print(f"Failed to download {file_url}: {e}")


for i in range(2015,2020):
    BASE_URL = f"https://data.worldpop.org/GIS/Population/Global_2015_2030/R2024B/{i}/"
    DOWNLOAD_DIR = f"1km/{i}"
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    download_countries(BASE_URL, DOWNLOAD_DIR)


