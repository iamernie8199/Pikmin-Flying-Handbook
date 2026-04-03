import requests
import json
import os
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
API_URL = "https://pikmin.askans.app/api/postcards?scope=all&sort=ranking&limit=20&offset="
OUTPUT_FILE = os.path.join(DIRECTORY, 'merged_data.json')


def fetch_data():
    """從 API 分頁下載所有資料，存成 data_*.json 檔案。"""
    for i in range(0, 980, 20):
        print(f"正在下載 offset={i} ...")
        try:
            response = requests.get(API_URL + str(i))
            response.raise_for_status()
            data = response.json()

            filepath = os.path.join(DIRECTORY, f'data_{i}.json')
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print(f"  已儲存 data_{i}.json")
        except requests.exceptions.HTTPError as err:
            print(f"  HTTP 錯誤: {err}")
        except Exception as e:
            print(f"  錯誤: {e}")

    print("\n所有分頁下載完成！")


def merge_jsons():
    """將所有 data_*.json 合併成一個 merged_data.json。"""
    json_files = [f for f in os.listdir(DIRECTORY)
                  if f.startswith('data_') and f.endswith('.json')]

    def extract_number(filename):
        match = re.search(r'data_(\d+)\.json', filename)
        return int(match.group(1)) if match else 0

    json_files.sort(key=extract_number)

    all_items = []

    for filename in json_files:
        filepath = os.path.join(DIRECTORY, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                items = data.get('items', [])
                all_items.extend(items)
                print(f"已讀取 {filename}, 包含 {len(items)} 個項目")
        except Exception as e:
            print(f"讀取 {filename} 時出錯: {e}")

    result = {
        "items": all_items,
        "hasMore": False
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)

    print(f"\n合併完成！總計 {len(all_items)} 個項目已儲存至 {OUTPUT_FILE}")


if __name__ == "__main__":
    print("=== 步驟 1: 從 API 下載資料 ===\n")
    fetch_data()
    print("\n=== 步驟 2: 合併所有 JSON 檔案 ===\n")
    merge_jsons()
