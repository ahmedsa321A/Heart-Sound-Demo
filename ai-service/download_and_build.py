import os
import sys
import zipfile
import urllib.request
import subprocess

FLUTTER_URL = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.5-stable.zip"
USER_DIR = os.path.expanduser("~")
ZIP_DEST = os.path.join(USER_DIR, "flutter_temp.zip")
EXTRACT_DEST = USER_DIR  # zip contains root 'flutter' folder -> C:\Users\Abdallah\flutter
FLUTTER_BIN = os.path.join(USER_DIR, "flutter", "bin")
FLUTTER_BAT = os.path.join(FLUTTER_BIN, "flutter.bat")
PROJECT_DIR = r"e:\heart_sound_demo\Heart-Sound-Demo\mobile"

def download_file(url, target_path):
    print(f"Downloading Flutter SDK from {url}...")
    def report(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = (downloaded / total_size) * 100
            mb_downloaded = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            sys.stdout.write(f"\rDownloading: {percent:.1f}% ({mb_downloaded:.1f} MB / {mb_total:.1f} MB)")
        else:
            mb_downloaded = downloaded / (1024 * 1024)
            sys.stdout.write(f"\rDownloading: {mb_downloaded:.1f} MB")
        sys.stdout.flush()

    urllib.request.urlretrieve(url, target_path, report)
    print("\n[OK] Download complete!")

def extract_zip(zip_path, extract_to):
    print(f"Extracting Flutter SDK to {extract_to}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    print("[OK] Extraction complete!")

def main():
    if not os.path.exists(FLUTTER_BAT):
        if not os.path.exists(ZIP_DEST):
            download_file(FLUTTER_URL, ZIP_DEST)
        extract_zip(ZIP_DEST, EXTRACT_DEST)
        if os.path.exists(ZIP_DEST):
            os.remove(ZIP_DEST)
    else:
        print(f"[OK] Flutter SDK already extracted at {os.path.dirname(FLUTTER_BIN)}")

    # Add to current environment PATH
    env = os.environ.copy()
    env["PATH"] = FLUTTER_BIN + ";" + env.get("PATH", "")

    print("\nRunning 'flutter pub get'...")
    res1 = subprocess.run([FLUTTER_BAT, "pub", "get"], cwd=PROJECT_DIR, env=env)
    if res1.returncode != 0:
        print("[ERROR] flutter pub get failed")
        return

    print("\nRunning 'flutter build apk --release'...")
    res2 = subprocess.run([FLUTTER_BAT, "build", "apk", "--release"], cwd=PROJECT_DIR, env=env)
    if res2.returncode == 0:
        print("\n========================================================")
        print("🎉 SUCCESS! APK built successfully!")
        print("APK Location: e:\\heart_sound_demo\\Heart-Sound-Demo\\mobile\\build\\app\\outputs\\flutter-apk\\app-release.apk")
        print("========================================================")
    else:
        print("[ERROR] flutter build apk failed")

if __name__ == "__main__":
    main()
