import csv

# 入力ファイルと出力ファイルのパス
input_file = "./public/data/raw_phone.tsv"  # 入力TSVファイル
output_file = "./public/data/normalized_phone.tsv"  # 補完後のTSVファイル

# データ補完処理
with open(input_file, "r", encoding="utf-8") as infile, open(output_file, "w", newline="", encoding="utf-8") as outfile:
    reader = csv.reader(infile, delimiter="\t")
    writer = csv.writer(outfile, delimiter="\t")

    # ヘッダー行をそのままコピー
    header = next(reader)
    writer.writerow(header)

    # 前の行の値を保持する変数
    previous_row = [None] * len(header)

    for row in reader:
        # 空のセルを前の行の値で補完
        for i, value in enumerate(row):
            if not value.strip():  # 空セルの場合
                row[i] = previous_row[i]
            else:
                previous_row[i] = value  # 値を更新
        writer.writerow(row)

print(f"補完されたデータが {output_file} に保存されました。")